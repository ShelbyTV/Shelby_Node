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
		deleteJobAndListen();
		
		tumblr_dao.userIsInSet(job.tumblr_id, function(is_in_set){
      if (is_in_set){
        util.log({"status":"user already in set, deleting job"});
        return deleteJobAndListen();
      } else {
				var info = {"tumblr_id":job.tumblr_id, "access_token":job.oauth_token, "access_token_secret":job.oauth_secret,"last_seen":0};
				tumblr_dao.setUserInfo(job.tumblr_id, info, function(err, res){
					if (err && !res){
						util.log({"error":"user info not set"});
						return deleteJobAndListen();
					} else {
						deleteJobAndListen();
						return self.getDashboard(info, job.tumblr_id, true);  
          }
        });
      }
    });
	};

  /*
  * Make API call to tumblr to get a given users dashboard
  * user_id : string : user tumblr id / primary blog name
  */
  this.getDashboard = function(info, tumblr_user_id, is_backfill){
    self.getOAuthClient(function(err, tumblr_client){
     self.startPolling(tumblr_client, info, tumblr_user_id, is_backfill);
    });          
  };

  /*
  * Create a new tumblr client and pass it to getDashboard func
  */
  this.getOAuthClient = function(callback){
    var tumblr_cfg = config.tumblr_keys;
    var tumblr_client = new OAuth('http://www.tumblr.com/oauth/request_token',
		                 'http://www.tumblr.com/oauth/access_token', 
		                 tumblr_cfg.consumer_key,  tumblr_cfg.consumer_secret, 
		                 "1.0A", null, "HMAC-SHA1");
		
    return callback(null,tumblr_client);
  };

	/*
  * Begin the polling proccess.
  */
	this.startPolling = function(tumblr_client, info, tumblr_user_id, is_backfill){  
		var access_token = {
			token: info.access_token,
			token_secret: info.access_token_secret
		};
		if (is_backfill){
			util.log({status:'retrieving pages', type:'backfill', tumblr_id:tumblr_user_id});
			self.doBackfill(tumblr_client, access_token, tumblr_user_id);
		} else {
			console.log("ID: " + sys.inspect(tumblr_user_id));
			util.log({status:'retrieving pages', type:'polling', tumblr_id:tumblr_user_id});  
			self.doPolling(tumblr_client, access_token, tumblr_user_id, 0, info.last_seen, []);
		}
  };

  /*
  * Begin the backfill proccess. Named start due to asyncness
  */
  this.doBackfill = function(tumblr_client, access_token, tumblr_user_id){  
    var page_counter = 0;
		var page_start = 12;
    for(var p=page_start; p>0; p-=1){ 
      
      self.getPage(tumblr_client, access_token, p, function(page){ 
        page_counter+=1;
        
        if (page_counter==page_start) { 
          tumblr_client = null;
        }

        self.getPageLinks(page.reverse(), function(link, post){
          return self.addLinkToQueue(link, post, tumblr_user_id, true);
        });
      });
    }  
  };

	this.doPolling = function(tumblr_client, access_token, tumblr_user_id, offset, since_id, urls){
		//offset = offset; // max 250
		var req_url = 'http://api.tumblr.com/v2/user/dashboard?type=video&offset=' + offset + '&since_id='+ since_id;
		tumblr_client.get(req_url, access_token.token, access_token.token_secret, function(error, data) {
			if(error) {sys.inspect(error);}
		  else {
		    var page = JSON.parse(data);
				var posts = page.response.posts;
				var temp_url_arry = [];
				
				//urls = urls.reverse();
					
				if (posts.length === 20) {
					console.log("parsed 20 posts");
					
					self.getPageLinks(posts, function(link, post){
						urls.unshift({'url': link, 'post': post.date});
	        });
					self.doPolling(tumblr_client, access_token, tumblr_user_id, offset+20, since_id, urls);
				} else {
					tumblr_client = null;
					/* set last seen post in redis */
				  //tumblr_dao.setUserProperty(tumblr_user_id, 'last_seen', page[0].id, function(err, res){
					//	if (err && !res){
					//		return util.log({"error":"last seen not set!"}); 
					//	}
					//});
					console.log("parsed " + posts.length + " posts");
					self.getPageLinks(posts, function(link, post){
						urls.unshift({'url': link, 'post': post.date});
						//console.log(post.date);
	        });
					/* urls are popped out of the urls array and send to link Q */
					while (urls.length >1){
						var vid = urls.shift();
						self.addLinkToQueue(vid.url, vid.post, tumblr_user_id, false);
					}
					return;
				}
		  }
		});
	};

  /*
  * Get the page_num page for a given user (oauth in the tumblr_client)
  */
  this.getPage = function(tumblr_client, access_token, page_num, callback){
		var offset = page_num * 10;
		var req_url = 'http://api.tumblr.com/v2/user/dashboard?type=video&offset='+ offset;
    
		tumblr_client.get(req_url, access_token.token, access_token.token_secret, function(error, data) {
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
  * Put the job specification on beanstalk
  * feed_obj : obj : the facebbok status update
  * user_id : string || int : tumblr user id
  */
	this.addLinkToQueue = function(link, post, user_id, is_backfill){
		var jobber_to_use = is_backfill ? self.jobber_high : self.jobber;
		
		var job_spec = {
			"tumblr_status_update":post.date,
			"url":link,
			"provider_type":"tumblr",
			"provider_user_id":user_id
		};
		util.log(job_spec);
		/* NOT PUTTING ON Q RIGHT NOW */
		//jobber_to_use.put(job_spec, function(data){
		return;
		//});
	};

  /*
  * Grab user set from redis and get each users since last seen feed.
  */
  this.getAllUserFeeds = function(){
    tumblr_dao.getUserSet(function(err, members){
      if (err || !members.length){
        return util.log({status:"error retrieving fb users or no users", type:"fb_feed"});
      }

      util.log({status:'initializing tumblr polling from redis'});

      for (var i in members){
        if (members.hasOwnProperty(i)){
					tumblr_dao.getUserInfo(members[i], function(err, info){
			      if (err && !(info && info.length==3)){
			        return util.log({"status":"ERR:info bad or not found"});
			      }
          	self.getDashboard(info, members[i], false, function(err, res){
            	if (err){
              	return util.log(err);
            	}
          	});
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
    self.jobber = JobManager.create(config.tumblr_backfill_tube, config.link_tube_high, self.initTumblrUser);
    self.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
      });
    });  
    self.jobber_high = JobManager.create(config.tumblr_backfill_tube, config.link_tube_high, self.initTumblrUser);
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

var f = new TumblrManager();
//f.init();

//var info = {"tumblr_id":"henry_poll", "access_token":"ZmYflNcu4AJz5xyLE2IA5rrdj0M1QwkxQ7CJChAr3xqt2BxvOw", "access_token_secret":"Wgvz8WaBkXG08fPbvMPR2QjfMEaiMuvkBL77U8JRQBaSqqlIWg", "last_seen":7773152764};
//f.getDashboard(info, 'henry_poll', false);

f.getAllUserFeeds();