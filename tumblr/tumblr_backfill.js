var config = require('../common/config.js'),
	util = require('../common/util.js'),
	tumblr_utils = require('./lib/tumblr_utils.js'),
	OAuth = require('./lib/oauth').OAuth,
	JobManager = require('../common/beanstalk/jobs.js'),
	async = require('async'),
	tumblr_dao = require('./lib/tumblr_dao.js'),
	sys = require('sys'),
	page_start = 12;

function BackfillManager(){
  
  var self = this;

	/*
  * Get Tumblr Client and pass it to startBackfill
  */
  this.addUser = function(job_data, deleteJob){
    util.log({"status":'commencing new job', "type":'backfill', "tumblr_id":job_data.tumblr_id});
		tumblr_dao.userIsInSet(job_data.tumblr_id, function(is_in_set){
      if (is_in_set){
        util.log({"status":"user already in set, deleting job"});
        return;
      } else {
        tumblr_dao.setUserInfo(job_data.tumblr_id, {"tumblr_id":job_data.tumblr_id, 
					"access_token":job_data.oauth_token, "token_secret": job_data.oauth_secret, "last_seen":0}, function(err, res){
	          if (err && !res){
	            util.log({"error":"user info not set"});
	            return;
	          } else {
	            self.getOAuthClient(job_data, deleteJob, function(err, tumblr_client){
								var access_tokens = {
									key: job_data.oauth_token,
									secret: job_data.oauth_secret
								};
					      self.startBackfill(tumblr_client, access_tokens, job_data.tumblr_id, deleteJob);
					    });
	          }
        });  
      }
    });    
  };

  /*
  * Create a new tumblr client and pass it to startbackfill pre-func
  */
  this.getOAuthClient = function(job_data, deleteJob, callback){
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
  * Begin the backfill proccess. Named start due to asyncness
  */
  this.startBackfill = function(tumblr_client, access_tokens, tumblr_user_id, deleteJob){  
    var page_counter = 0;
    for(var p=page_start; p>0; p-=1){ 
      util.log({status:'retrieving pages', type:'backfill', tumblr_id:tumblr_user_id});
      
      self.getPage(tumblr_client, access_tokens, p, function(page){ 
        page_counter+=1;
        
        if (page_counter==page_start) { 
          tumblr_client = null;
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
  * Throw a proccessed link back on the queue
  */
	this.addLinkToQueue = function(link, post, tumblr_id){
    var job_spec = {
       "tumblr_post":post,
       "link":link,
       "provider_type":"tumblr",
       "provider_user_id":tumblr_id
    };
		console.log("JOB.link: ", job_spec.link,", Date: "+post.date);
		/*
    self.jobber.put(job_spec, function(err, res){
      return;
    });
		*/
  };  

  /*
  * Switch for the job action and execute the corresponding function
  */
  this.proccessNewJob = function(job, deleteJob){ 
  deleteJob();
  console.log(job);
  switch(job.action){ 
      case 'add_user':
      self.addUser(job, deleteJob);
      break;

      default:
      util.log({"status":"NO JOB ACTION", "job":job});
      break;
    }
  };
  
  this.init = function(){
    self.jobber = JobManager.create(config.tumblr_backfill_tube, config.link_tube_high, self.proccessNewJob); 
     console.log(config.tumblr_backfill_tube, config.tumblr_link_tube);
     self.jobber.poolect(20, function(err, res){
     setInterval(function(){console.log('POOL SIZE:', self.jobber.respool.pool.length);}, 5000); 
     self.jobber.reserve(function(err, res){
       return;
      });
    });  
  };  
}

var b = new BackfillManager();
b.init();



