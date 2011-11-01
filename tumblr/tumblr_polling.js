var config = require('../common/config.js'),
	util = require('../common/util.js'),
	tumblr_utils = require('./lib/tumblr_utils.js'),
	OAuth = require('oauth').OAuth,
	JobManager = require('../common/beanstalk/jobs.js'),
	tumblr_dao = require('./lib/tumblr_dao.js'),
	sys = require('sys'),
	page_start = 10;

function TumblrManager(){
	
	var self = this;
	/*
	* Initialize tumblr metadata in redis (if user does not exist)
	* job : obj : beanstalk job
	* deleteJobAndListen : function : delete current job from bs
	*/
	this.initTumblrUser = function(job, deleteJobAndListen){
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
						return self.getDashboard(info, true);	 
					}
				});
			}
		});
	};

	/*
	* Make API call to tumblr to get a given users dashboard
	* info : json obj : user tumblr id / primary blog name, access_token, access_token_secret, last_seen
	*/
	this.getDashboard = function(info, is_backfill){
		self.getOAuthClient(function(err, tumblr_client){
		 self.startPolling(tumblr_client, info, is_backfill);
		});					 
	};

	/*
	* Create a new tumblr client and pass it to getDashboard func
	*/
	this.getOAuthClient = function(callback){
		var tumblr_cfg = config.tumblr_keys;
		var tumblr_client = new OAuth('http://www.tumblr.com/oauth/request_token',
										 'http://www.tumblr.com/oauth/access_token', 
										 tumblr_cfg.consumer_key,	 tumblr_cfg.consumer_secret, 
										 "1.0A", null, "HMAC-SHA1");
		
		return callback(null,tumblr_client);
	};

	/*
	* Begin the polling proccess.
	*/
	this.startPolling = function(tumblr_client, info, is_backfill){	 
		var access_token = { token: info.access_token, token_secret: info.access_token_secret };
		if (is_backfill){
			//util.log({status:'retrieving pages', type:'backfill', tumblr_id:info.tumblr_id});
			self.doBackfill(tumblr_client, access_token, info.tumblr_id, 0, []);
		} else {
			//util.log({status:'retrieving pages', type:'polling', tumblr_id:info.tumblr_id});
			/* Start with an offset of 1 to ignore the first post which IS the last seen post from last polling */
			self.doPolling(tumblr_client, access_token, info.tumblr_id, 1, info.last_seen, []);
		}
	};

	/*
	* Begin the backfill proccess after initial auth
	*/
	this.doBackfill = function(tumblr_client, access_token, tumblr_user_id, page_num, urls){
		var offset = page_num * 20;
		var req_url = 'http://api.tumblr.com/v2/user/dashboard?type=video&offset=' + offset;
		tumblr_client.get(req_url, access_token.token, access_token.token_secret, function(error, data) {
			if(error) {sys.inspect(error);}
			else {
				var page = JSON.parse(data);
				var posts = page.response.posts;
				
				if (page_num < page_start) {
					if (page_num === 0){
						/* set most recent post to redis */
						tumblr_dao.setUserProperty(tumblr_user_id, 'last_seen', posts[0].id, function(err, res){
							if (err && !res){
								return util.log({"error":"last seen not set!"}); 
							}
						});
					}
					
					self.getPageLinks(posts, function(link, post){
						urls.push({'url': link, 'post': post});
					});
	
					/* increment page counter and get next page */
					page_num += 1;
					self.doBackfill(tumblr_client, access_token, tumblr_user_id, page_num, urls);
				} else if (page_num === page_start){
					tumblr_client = null;
					
					self.getPageLinks(posts, function(link, post){
						urls.push({'url': link, 'post': post});
					});
					
					/* urls are popped out of the urls array and send to link Q */
					while (urls.length >1){
						var vid = urls.pop();
						self.addLinkToQueue(vid.url, vid.post, tumblr_user_id, true);
					}
					return;
				}
			}
		});
	};

	/* 
	* Poll a users dashboard since the last time we checked
	*/
	this.doPolling = function(tumblr_client, access_token, tumblr_user_id, offset, since_id, urls){
		var req_url = 'http://api.tumblr.com/v2/user/dashboard?type=video&offset=' + offset + '&since_id='+ since_id;
		tumblr_client.get(req_url, access_token.token, access_token.token_secret, function(error, data) {
			if(error) {sys.inspect(error);}
			else {
				var page = JSON.parse(data);
				var posts = page.response.posts;
				
				if (posts.length === 20) {
					
					self.getPageLinks(posts, function(link, post){
						urls.unshift({'url': link, 'post': post.id});
						self.doPolling(tumblr_client, access_token, tumblr_user_id, offset+20, since_id, urls);
					});
					//self.doPolling(tumblr_client, access_token, tumblr_user_id, offset+20, since_id, urls);
				} else {
					/* destroy tumblr client */
					tumblr_client = null;

					/* set last seen post in redis */
					if(posts.length !== 0){
						tumblr_dao.setUserProperty(tumblr_user_id, 'last_seen', posts[posts.length -1].id, function(err, res){
							if (err && !res){
								return util.log({"error":"last seen not set!"}); 
							}
						});
					}
					
					self.getPageLinks(posts, function(link, post){
						urls.unshift({'url': link, 'post': post});
						while (urls.length > 0){
							var vid = urls.shift();
							if (typeof vid.post !== 'object'){
							  console.log('BAD POLLING VID:', vid);
							} else {
							  console.log('VALID POLLING VID:', vid.url);
							  self.addLinkToQueue(vid.url, vid.post, tumblr_user_id, false);
							}
						}
					});
					
					
					/* urls are popped out of the urls array and send to link Q */
					/*while (urls.length > 0){
						var vid = urls.shift();
                                                if (typeof vid.post !== 'object'){
                                                  console.log('BAD POLLING VID:', vid);
						} else {
                                                  console.log('VALID POLLING VID:', vid.url);
						  self.addLinkToQueue(vid.url, vid.post, tumblr_user_id, false);
                                                }
					}*/
					return;
				}
			}
		});
	};


	/*
	* Get all links on a given page
	*/
	this.getPageLinks = function(page, linkExtractedCallback){ 
		var post_embed = '',
				links = '',
				video = {};
				
		if (page.length > 0){
			for (var i=0; i < page.length; i++) {
				var exp = /\(?\bhttp:\/\/[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|]/g;
				/* Making sure a post has a player attribute */
				if (page[i].type === 'video'){
					post_embed = page[i].player[0].embed_code;
					if (exp.test(post_embed)){
						links = unescape(post_embed).match(exp).uniques();
						for (var j in links){
							/* tumblr_utils has list of supported domains */
							video = tumblr_utils.findUrl(links[j]);
							if (video.url !== null && typeof page[i] === 'object'){ 
							  //console.log(Object.keys(page[i]).length);
							  linkExtractedCallback(video.url, page[i]); 
							}
						}
					}
				/* For some reason a post or two gets returned as a function (not sure why... hmmm. node thing?) */
				} else if (typeof page[i] === 'function' && page[i]()[0].player){
					post_embed = page[i]()[0].player[0].embed_code;
					if (exp.test(post_embed)){
						links = unescape(post_embed).match(exp).uniques();
						for (var k in links){
							/* tumblr_utils has list of supported domains */
							video = tumblr_utils.findUrl(links[k]);
							console.log('FUNCTION CONDITION', page[k]);
							if (video.url !== null){ linkExtractedCallback(video.url, page[k]); }
						}
					}
				} else {
					console.log('NON VIDEO POST', page[i].type);
				}
			}
		}
	};

	/*
	* Put the job specification on beanstalk
	* link : string : the video url form post
	* post : obj : the raw post
	* user_id : string || int : tumblr user id
	* is_backfill : bool
	*/
	this.addLinkToQueue = function(link, post, user_id, is_backfill){
		var jobber_to_use = is_backfill ? self.jobber_high : self.jobber;
		
		var job_spec = {
			"tumblr_status_update":post,
			"url":link,
			"provider_type":"tumblr",
			"provider_user_id":user_id
		};
		//util.log(job_spec);
		/* NOT PUTTING ON Q RIGHT NOW */
		jobber_to_use.put(job_spec, function(data){
			return;
		});
	};

	/*
	* Grab user set from redis and get each users since last seen feed.
	*/
	this.getAllUserFeeds = function(){
		tumblr_dao.getUserSet(function(err, members){
			if (err || !members.length){
				//return util.log({status:"error retrieving tumblr users or no users", type:"tumblr_feed"});
				return;
			}

			util.log({status:'initializing tumblr polling from redis'});

			for (var i in members){
				if (members.hasOwnProperty(i)){
					tumblr_dao.getUserInfo(members[i], function(err, info){
						if (err && !(info && info.length==3)){
							return util.log({"status":"ERR:info bad or not found"});
						}
						self.getDashboard(info, false, function(err, res){
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
		self.jobber = JobManager.create(config.tumblr_backfill_tube, config.link_tube, self.initTumblrUser);
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
* 3. setInterval (polling the tumblr api)
*/

var t = new TumblrManager();
t.init();

t.getAllUserFeeds();
