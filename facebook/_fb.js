var config = require('../common/config.js');
var util = require('../common/util.js');
var facebookClient = require('facebook-js')(config.facebook.app_id, config.facebook.app_secret);
var fb_dao = require('./lib/facebook_dao.js');
var JobManager = require('../common/beanstalk/jobs.js');
//var profiler = require('v8-profiler');

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
      if (is_in_set){
        util.log({"status":"user already in set, deleting job"});
        return deleteJobAndListen();
      }else{
        fb_dao.setUserInfo(job.fb_id, {"facebook_id":job.fb_id, "access_token":job.fb_access_token, "last_seen":0}, function(err, res){
          if (err && !res){
            util.log({"error":"user info not set"});
            return deleteJobAndListen();
          }else{
            deleteJobAndListen();
            return self.getFeed(job.fb_id);  
          }
        });  
      }
    });
  };

  /*
  * Make API call to facebook to get a given users feed
  * user_id : int || string : user facebook id
  * deleteJobAndListen : function : delete current job from bs
  */
  this.getFeed = function(user_id, deleteJobAndListen){ 
    fb_dao.getUserInfo(user_id, function(err, info){
      if (err && !(info && info.length==3)){
        return util.log({"status":"ERR:info bad or not found"});
      }
      
      facebookClient.apiCall('GET','/'+user_id+'/home', {since:info.last_seen, access_token: info.access_token, /*fields:'type,source,name,from',*/ limit:1000}, function(err, feed){
        util.log('GOT FEED');
        util.log(feed);
        err ? util.log(err) : '';
        if (err || !(feed && feed.data)) {return util.log({"status":"ERR:bad API call or no new feed data"});}
        util.getTimestamp('s', function(ts){
          fb_dao.setUserProperty(user_id, 'last_seen', ts, function(err, res){
            if (err && !res){
              return util.log({"error":"last seen not set!"}); 
            }
            return self.parseFeed(feed, user_id);  
          });
        });
      });          
    });
  };

  /*
  * Validate presence of feed data - delete job - pass each element to addLinkToQueue
  * feed : obj : all metadata for facebook update
  * user_id : int || string : facebook user id
  * deleteJobAndListen : function : delete current job from bs
  */
  this.parseFeed = function(feed, user_id){ 
    var feed_length = feed.data.length;

    if (feed && feed.data && feed.data.length){
      util.log({"status":"feed retrieved now parsing", "type":"fb_feed"});     
      for (var i in feed.data){
        if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source){
  	      self.addLinkToQueue(feed.data[i], user_id);
        }	
      }	
    }
  };

  /*
  * Put the job specification on beanstalk
  * feed_obj : obj : the facebbok status update
  * user_id : string || int : facebook user id
  */
  this.addLinkToQueue = function(feed_obj, user_id){
    if(feed_obj.hasOwnProperty('application')){
      delete feed_obj.application;  
    }
    var job_spec = {
      "facebook_status_update":feed_obj,
      "url":feed_obj.source,
      "provider_type":"facebook",
      "provider_user_id":user_id
    };
    util.log(job_spec);
    self.jobber.put(job_spec, function(data){
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
          self.getFeed(members[i], function(err, res){
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
    self.jobber = JobManager.create(config.facebook.tube_add, config.twitter_link_tube, self.initFbUser);
    
    self.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
        return;
      });
    });  
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

f.getAllUserFeeds();

/*
setInterval(function()
{
  f.getAllUserFeeds();
}, 10000);

setInterval(function()
{
  console.log(process.memoryUsage());
},  5000);
*/

