var config = require('../common/config.js'),
page_start = 17,
util = require('../common/util.js'),
twitter = require('./lib/node-twitter/lib/twitter.js'),
JobManager = require('../common/beanstalk/jobs.js'),
async = require('async');

function BackfillManager(){
  
  var self = this;

  /*
  * Throw a proccessed link back on the queue
  */
  this.addLinkToQueue = function(link, tweet, twitter_id){
    var job_spec = {
       "twitter_status_update":tweet,
       "url":link,
       "provider_type":"twitter",
       "provider_user_id":twitter_id
    };

    self.jobber.putJson(job_spec, function(err, res){
      return;
    });
  };

  /*
  * Get the page_num page for a given user (oauth in the twit_client)
  */
  this.getPage = function(twit_client, page_num, callback){
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
  * Create a new twitter client and pass it to startbackfill pre-func
  */
  this.getTwitterClient = function(job_data, deleteJob, callback){
    //var twit_cfg = config.twitter_keys;
    var twit_cfg = {};
    twit_cfg.access_token_key = job_data.oauth_token;
    twit_cfg.access_token_secret = job_data.oauth_secret;
    var twitter_client = new twitter(twit_cfg);
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
    self.jobber = JobManager.create(config.twitter_backfill_tube, config.resolver.tube_add, self.proccessNewJob); 
     console.log(config.twitter_backfill_tube, config.resolver.tube_add);
     self.jobber.poolect(20, function(err, res){
     setInterval(function(){console.log('POOL SIZE:', self.jobber.respool.pool.length)}, 5000); 
     self.jobber.reserve(function(err, res){
       return;
      });
    });  
  };  
}

var b = new BackfillManager();
b.init();



