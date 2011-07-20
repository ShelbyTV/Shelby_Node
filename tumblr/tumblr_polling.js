var config = require('../common/config.js'),
	util = require('../common/util.js'),
	tumblr_utils = require('./lib/tumblr_utils.js'),
	OAuth = require('./lib/oauth').OAuth,
	JobManager = require('../common/beanstalk/jobs.js'),
	async = require('async'),
	tumblr_dao = require('./lib/tumblr_dao.js'),
	sys = require('sys'),
	page_start = 12;

function TumblrManager(){
	
  var self = this;
  /*
  * Initialize tumblr metadata in redis (if user does not exist)
  * job : obj : beanstalk job
  * deleteJobAndListen : function : delete current job from bs
  */
  this.initTumblrUser = function(job, deleteJobAndListen){
    console.log('JOB:', job);
    tumblr_dao.userIsInSet(job.tumblr_id, function(is_in_set){
      if (is_in_set){
        util.log({"status":"user already in set, deleting job"});
        return deleteJobAndListen();
      }else{
        tumblr_dao.setUserInfo(job.tumblr_id, {"tumblr_id":job.tumblr_id, "access_token":job.oauth_token, "token_secret":job.oauth_secret,"last_seen":0}, function(err, res){
          if (err && !res){
            util.log({"error":"user info not set"});
            return deleteJobAndListen();
          }else{
            deleteJobAndListen();
            return self.getFeed(job, job.tumblr_id, true);  
          }
        });
      }
    });
  };

  /*
  * Create a new tumblr client and pass it to getFeed func
  */
  this.getOAuthClient = function(job_data, callback){
    var tumblr_cfg = config.tumblr_keys;
    //var tumblr_cfg = {};
    //tumblr_cfg.access_token_key = job_data.oauth_token;
    //tumblr_cfg.access_token_secret = job_data.oauth_secret;
    var tumblr_client = new OAuth('http://www.tumblr.com/oauth/request_token',
		                 'http://www.tumblr.com/oauth/access_token', 
		                 tumblr_cfg.consumer_key,  tumblr_cfg.consumer_secret, 
		                 "1.0A", null, "HMAC-SHA1");
		
    return callback(null, tumblr_client);
  };



  /*
  * Make API call to tumblr to get a given users feed
  * user_id : int || string : user tumblr id
  * deleteJobAndListen : function : delete current job from bs
  */
  this.getFeed = function(job, user_id, is_backfill){ 
    tumblr_dao.getUserInfo(user_id, function(err, info){
      if (err && !(info && info.length==3)){
        return util.log({"status":"ERR:info bad or not found"});
      }

      self.getOAuthClient(job_data, function(err, tumblr_client){
				var access_tokens = {
					key: job_data.oauth_token,
					secret: job_data.oauth_secret
				};
	      self.startPolling(tumblr_client, access_tokens, job_data.tumblr_id, deleteJob, is_backfill);
      });          
    });
  };


	/*
  * Begin the polling proccess.
  */
	this.startPolling = function(tumblr_client, access_tokens, tumblr_user_id, deleteJob, is_backfill){  
		var page_counter = 0;
		for(var p=page_start; p>0; p-=1){ 
			if (is_backfill) { util.log({status:'retrieving pages', type:'backfill', tumblr_id:tumblr_user_id}); }
			else { 
				util.log({status:'retrieving pages', type:'polling', tumblr_id:tumblr_user_id});  
			}
      self.getPage(tumblr_client, access_tokens, p, function(page){ 
        page_counter+=1;
        
        if (page_counter==page_start) { 
					tumblr_client = null;
					/* set last seen post to redis */
				  tumblr_dao.setUserProperty(tumblr_user_id, 'last_seen', page[0].id, function(err, res){
						if (err && !res){
							return util.log({"error":"last seen not set!"}); 
						}
					});
				}
				
				self.getPageLinks(page.reverse(), function(link, post){
					return self.addLinkToQueue(link, post, tumblr_user_id);
				});
			});
    }
  };


  /*
  * Get the page_num page for a given user (oauth in the tumblr_client)
  */
  this.getPage = function(tumblr_client, access_tokens, page_num, callback){
		var offset = page_num * 10;
		var req_url = 'http://api.tumblr.com/v2/user/dashboard?type=video&offset='+ offset;
    
		tumblr_client.get(req_url, access_tokens.key, access_tokens.secret, function(error, data) {
		  if(error) {console.log("ERROR" + require('sys').inspect(error));}
		  else {
		    var page = JSON.parse(data).response.posts;
				console.log("Page: ", page_num);
				return callback(page);
		  }
		});
  };

  /*
  * Get all links on a given page
  */
  this.getPageLinks = function(page, linkExtractedCallback){ 
    for (var i in page){ 
      var exp = /\(?\bhttp:\/\/[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|]/g;
			/* Making sure a post has a player attribute */
			if (page[i].player){
				var post_embed = page[i].player[0].embed_code;
				if (exp.test(post_embed)){
					var links = unescape(post_embed).match(exp).uniques();
					for (var j in links){
						var video = tumblr_utils.findUrl(links[j]);
						if (video.url !== null){ linkExtractedCallback(video.url, page[i]); }
					}
				}
			/* For some reason a post or two gets returned as a function (??) */
			} else if (page[i]()[0].player){
				var post_embed = page[i]()[0].player[0].embed_code;
				if (exp.test(post_embed)){
					var links = unescape(post_embed).match(exp).uniques();
					for (var j in links){
						var video = tumblr_utils.findUrl(links[j]);
						if (video.url !== null){ linkExtractedCallback(video.url, page[i]); }
					}
				}
			}
    }
  };

  /*
  * Validate presence of feed data - delete job - pass each element to addLinkToQueue
  * feed : obj : all metadata for tumblr update
  * user_id : int || string : tumblr user id
  * deleteJobAndListen : function : delete current job from bs
  */
  this.parseFeed = function(feed, user_id, is_backfill){ 
    var feed_length = feed.data.length;

    if (feed && feed.data && feed.data.length){
      util.log({"status":"feed retrieved now parsing", "type":"fb_feed"});     
      for (var i in feed.data){
        if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source){
  	      self.addLinkToQueue(feed.data[i], user_id, is_backfill);
        }	
      }	
    }
  };

  /*
  * Put the job specification on beanstalk
  * feed_obj : obj : the facebbok status update
  * user_id : string || int : tumblr user id
  */
  this.addLinkToQueue = function(feed_obj, user_id, is_backfill){
    var jobber_to_use = is_backfill ? self.jobber_high : self.jobber;
    if(feed_obj.hasOwnProperty('application')){
      delete feed_obj.application;  
    }
    var job_spec = {
      "tumblr_status_update":feed_obj,
      "url":feed_obj.source,
      "provider_type":"tumblr",
      "provider_user_id":user_id
    };
    util.log(job_spec);
    jobber_to_use.put(job_spec, function(data){
      return;
    });
  };

  /*
  * Grab user set from redis and get each users since last seen feed.
  */
  this.getAllUserFeeds = function(){
    fb_dao.getUserSet(function(err, members){
      if (err || !members.length){
        return util.log({status:"error retrieving fb users or no users", type:"fb_feed"});
      }

      util.log({status:'initializing tumblr polling from redis'});

      for (var i in members){
        if (members.hasOwnProperty(i)){
          self.getFeed(members[i], false, function(err, res){
            if (err){
              return util.log(err);
            }
          });  
        }
      }
      setTimeout(function(){
        process.exit();
      }, members.length*10*1000);
    });  
  };

  /*
  * Initialize job-queue listening
  */
  this.init = function(){
    self.jobber = JobManager.create(config.tumblr.tube_add, config.link_tube, self.initFbUser);
    self.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
      });
    });  
    self.jobber_high = JobManager.create(config.tumblr.tube_add, config.link_tube_high, self.initFbUser);
    self.jobber_high.poolect(20, function(err,res){});
  };
}

/*
* Initialization sequence
--------------------------
* 1. Grab all feeds
* 2. Attach listener to job queue
* 3. setInterval (polling the fb api)
*/

var f = new tumblrManager();
f.init();

f.getAllUserFeeds();