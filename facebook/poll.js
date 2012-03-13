var config = require('../common/config.js');
var util = require('../common/util.js');
var querystring = require('querystring');
var https = require('https');
var fb_dao = require('./lib/facebook_dao.js');
var JobManager = require('../common/beanstalk/jobs.js');

function FacebookManager(){
  
  var self = this;
  /*
  * Initialize facebook metadata in redis (if user does not exist)
  * job : obj : beanstalk job
  * deleteJobAndListen : function : delete current job from bs
  */
  this.initFbUser = function(job, deleteJobAndListen){
    console.log('JOB:', job);
    fb_dao.userIsInSet(job.fb_id, function(is_in_set){
        var user_info = {
          "facebook_id":job.fb_id,
          "access_token":job.fb_access_token,
        };
        if (!is_in_set){
          user_info.last_seen = 0;
        }
        var is_backfill = is_in_set ? false : true;
        fb_dao.setUserInfo(job.fb_id, user_info, function(err, res){
          if (err && !res){
            util.log({"error":"user info not set"});
            return deleteJobAndListen();
          }else{
            deleteJobAndListen();
            return self.getFeed(job.fb_id, true);  
          }
        });  
    });
  };

  /*
  * Make API call to facebook to get a given users feed
  * user_id : int || string : user facebook id
  * deleteJobAndListen : function : delete current job from bs
  */
  this.getFeed = function(user_id, is_backfill){ 
    fb_dao.getUserInfo(user_id, function(err, info){
      if (err && !(info && info.length==3)){
        return util.log({"status":"ERR:info bad or not found"});
        console.log(err);
      }

    var https_options = {
      host:'graph.facebook.com',
      path:'/'+user_id+'/home?'+querystring.stringify({access_token:info.access_token, since:info.last_seen, limit:1000}),
      method:'GET'
    };

    var req = https.request(https_options, function(response){
      response.setEncoding('utf8');
      var output = '';
      response.on('data', function(d){
        output+=d;
      });

      response.on('end', function(){
        try {
          var feed = JSON.parse(output);
        } catch (e){
          return util.log({"status":"ERR:could not JSON parse"})
        }
        if (!feed || !feed.data) {console.log(feed);return util.log({"status":"ERR:bad API call or no new feed data"});}
        util.getTimestamp('s', function(ts){
          fb_dao.setUserProperty(user_id, 'last_seen', ts, function(err, res){
            if (err && !res){
              return util.log({"error":"last seen not set!"}); 
            }
            return self.parseFeed(feed, user_id, is_backfill);  
          });
        });
      });
    });
    
    req.end();

    req.on('error', function(e){
      console.log('ERROR', e);
    });
    });
  };

  /*
  * Validate presence of feed data - delete job - pass each element to addLinkToQueue
  * feed : obj : all metadata for facebook update
  * user_id : int || string : facebook user id
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
  * user_id : string || int : facebook user id
  */
  this.addLinkToQueue = function(feed_obj, user_id, is_backfill){
    var jobber_to_use = is_backfill ? self.jobber_high : self.jobber;
    if(feed_obj.hasOwnProperty('application')){
      delete feed_obj.application;  
    }
    var job_spec = {
      "facebook_status_update":feed_obj,
      "url":feed_obj.source,
      "provider_type":"facebook",
      "provider_user_id":user_id
    };
    jobber_to_use.put(job_spec, function(data){
      console.log('successfully put job');
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
      
      util.log({status:'initializing facebook polling from redis'});

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
      }, members.length*1000);
    });  
  };
  
  /*
  * Initialize job-queue listening
  */
  this.init = function(){
    self.jobber = JobManager.create(config.facebook.tube_add, config.link_tube, self.initFbUser);
    self.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
      });
    });  
    self.jobber_high = JobManager.create(config.facebook.tube_add, config.link_tube_high, self.initFbUser);
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

var f = new FacebookManager();

f.init();

setTimeout(function(){
  process.exit();
}, 30*60*1000);

//f.getAllUserFeeds();
