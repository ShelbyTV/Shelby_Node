var config = require('../common/config.js'),
page_start = 12,
util = require('../common/util.js'),
oauth = require('./lib/oauth').OAuth,
JobManager = require('../common/beanstalk/jobs.js'),
async = require('async');

function BackfillManager(){
  
  var self = this;

  /*
  * Begin the backfill proccess. Named start due to asyncness
  */
  this.startBackfill = function(twit_client, twitter_user_id, deleteJob){  
    var page_counter = 0;
    for(var p=page_start; p>0; p-=1){ 
      util.log({status:'retrieving pages', type:'backfill', twitter_id:twitter_user_id});
      
      self.getPage(twit_client, p, function(page){ 
        page_counter+=1;
        
        if (page_counter==17) { 
          twit_client = null;
        }

        self.getPageLinks(page, function(link, tweet){
          return self.addLinkToQueue(link, tweet, twitter_user_id);
        });
      });
    }  
  };

  /*
  * Get the page_num page for a given user (oauth in the twit_client)
  */
  this.getPage = function(page_num, callback){
		oauth.get(req_url, tumblrAccessToken, tumblrAccessTokenSecret, function(error, data) {
		  if(error) {console.log(require('sys').inspect(error));}
		  else {
		    var dashboard = JSON.parse(data);
			console.log(dashboard.response.posts[0].date);
		  }
		});
	
    twit_client.get('/statuses/home_timeline.json', {include_entities:true, count:200, page:page_num}, function(page) 
    {   
        return callback(page);
    });  
  };

  /*
  * Get all links on a given page
  */
  this.getPageLinks = function(page, linkExtractedCallback){ 
    for (var i in page){ 
      if (page[i] && page[i].entities && page[i].entities.urls && page[i].entities.urls.length){ 
          var url = page[i].entities.urls[0].expanded_url ? page[i].entities.urls[0].expanded_url : page[i].entities.urls[0].url;
          linkExtractedCallback(url, page[i]);
      }
    }
  };

	/*
	* Create a link out of an embed
	*/
	this.createLink = function(embed){
		var link = embed;
		return link;
	};

  /*
  * Throw a proccessed link back on the queue
  */
	this.addLinkToQueue = function(link, post, tumblr_id){
    var job_spec = {
       "tumblr_post":post,
       "embed":link,
       "provider_type":"tumblr",
       "provider_user_id":tumblr_id
    };

    self.jobber.put(job_spec, function(err, res){
      return;
    });
  };  

  /*
  * Create a new twitter client and pass it to startbackfill pre-func
  */
  this.getOAuthClient = function(job_data, deleteJob, callback){
    var tumblr_cfg = config.tumblr_keys;
    //var twit_cfg = {};
    tumblr_cfg.access_token_key = job_data.oauth_token;
    tumblr_cfg.access_token_secret = job_data.oauth_secret;
    var tumblr_client = new new OAuth('http://www.tumblr.com/oauth/request_token',
		                 'http://www.tumblr.com/oauth/access_token', 
		                 tumblr_cfg.consumer_token,  tumblr_cfg.consumer_secret, 
		                 "1.0A", null, "HMAC-SHA1");
		
    return callback(null, twitter_client);
  };

  /*
  * Get Twitter Client and pass it to startBackfill
  */
  this.addUser = function(job_data, deleteJob){
    util.log({"status":'commencing new job', "type":'backfill', "twitter_id":job_data.twitter_id});
    self.getTwitterClient(job_data, deleteJob, function(err, twit_cl){
      self.startBackfill(twit_cl, job_data.twitter_id, deleteJob);
    });    
  };

  /*
  * Switch for the job action and execute the corresponding function
  */
  this.proccessNewJob = function(job, deleteJob){ 
  deleteJob();  
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
    self.jobber = JobManager.create(config.twitter_backfill_tube, config.link_tube_high, self.proccessNewJob); 
     console.log(config.twitter_backfill_tube, config.twitter_link_tube);
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



