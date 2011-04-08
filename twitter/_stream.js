//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//redis//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var JobManager = require('../common/beanstalk/jobs.js');
var twit = new twitter(config.twitter_keys);
//streams//
var full_streams = [];
var partial_streams = [];

function TwitterStreamManager(){
  
  var self = this;
  
  this.parseSiteStreamTweet = function(tweet){
    if (tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length){
      for (var i in tweet.message.entities.urls){
        if (tweet.message.entities.urls.hasOwnProperty(i)){
          self.buildJob(tweet.message, tweet.message.entities.urls[i], tweet.for_user);  
        }
      } 
    }
  };

  this.buildJob = function(tweet, url, twitter_id){
      url = url.expanded_url ? url.expanded_url : url.url;
      var job_spec = {
         "twitter_status_update":tweet,
         "url":url,
         "provider_type":"twitter",
         "provider_user_id":twitter_id
      };
      self.jobber.put(job_spec, function(r){
        util.log({"src":"StreamManager", "status":"built job for "+twitter_id});  
      });
  };

  this.defineStream = function(following, deleteJob){
    twit.stream('site', {"follow":following, "with":'followings'}, function(stream){   
        var stream_object = {
          "stream":stream,
          "following":following
        };

        if (following.length==config.twitter_stream_limit){
          full_streams.push(stream_object);
        } else {
          partial_streams.push(stream_object);
        }

        stream.on('data', function (data) {
          return self.parseSiteStreamTweet(data);
        });

        stream.on('end', function(data) { 
          return process.exit();
        });

        if (deleteJob) { 
          redis.sadd(config.redis_config.stream_key, following[0], function(err, res) {
            deleteJob(function(err, res){
                return initJobs();
            });
          });
        }
    });  
  };

  this.buildStream = function(ids, deleteJob){
    if (ids.length===0){
      return deleteJob? deleteJob(): null;
    } 
    var id_arrays = [];
    while (ids.length>config.twitter_stream_limit){
      id_arrays.push(ids.splice(0,config.twitter_stream_limit));
    }
    id_arrays.push(ids); //one id_arr for each stream  

    for (var i in id_arrays){ 
      if (id_arrays.hasOwnProperty(i)){
        util.log('BUILDING STREAM FOR:');
        util.log(id_arrays[i]);
        self.defineStream(id_arrays[i], deleteJob);  
      }
    }
  };
  
  this.processNewJob = function(job, deleteJob){
    switch(job.action) {
      case 'add_user':
      redis.sismember(config.redis_config.stream_key, job.twitter_id, function(err, res){
        if (res/1){
         util.log({"status":'user already in stream', "twitter_id":job.twitter_id}); 
         return deleteJob();
        } else {
          util.log({"status":"Adding stream from beanstalk", "type":"stream"});
          should_compact = true;
          return self.buildStream([job.twitter_id], deleteJob);
        }
      });
      break;
      
      case 'del_user':
      break;
    } 
  };  
  
  this.getAllStreamUsers = function(callback){
    redis.smembers(config.redis_config.stream_key, function(err, stream_ids){
      if (!err){
        return callback(stream_ids);
      } else {
        return util.log({"status":"error", "msg":err});
      }
    });  
  };
  
  this.init = function(){
    self.jobber = JobManager.create(config.twitter_stream_tube_add, config.twitter_link_tube, self.processNewJob);
    
    self.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
        return;
      });
    });  
  };
  
}


var str = new TwitterStreamManager();
str.getAllStreamUsers(str.buildStream);
str.init();
setInterval(process.exit, 600000);

setInterval(function()
{
  util.log('FULL STREAMS: '+full_streams.length);
  return util.log('PARTIAL STREAMS: '+partial_streams.length);
}, 10000);

