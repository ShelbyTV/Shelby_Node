var config = require('../../common/config.js');
var util = require('../../common/util.js');
var twitter_client = require('./node-twitter-2/lib/twitter.js');
var u = require('util');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
var resque = require('coffee-resque').connect({
  host: config.resque_config.host,
  port: config.resque_config.port
});

var TwitterStream = function(sort_order){
  this.jobsBuilt = 0;
  this.jobsBuiltGt = 0;
  this.jobsBuiltUnfollow = 0;
  this.sortOrder = sort_order;
  this.full_streams = [];
  this.partial_streams = [];
  this.bind('redis:all_users', this.chunkizeFollowers);
  this.bind('stream:followers', this.defineStream);
  this.bind('tweet:parsed', this.buildJob);
  this.bind('unfollow:parsed', this.buildUnfollowResqueJob);
};

/*
 * Initialize twitter stream
 */
TwitterStream.prototype.initialize = function(){
  var self = this;
  this.initJobQueue(function(){
    self.getAllStreamUsers();
  });
};

/*
 * Attach to beanstalk
 */
TwitterStream.prototype.initJobQueue = function(cb){
  var self = this;
  this.jobber = require('../../common/beanstalk/jobs.js').create(config.twitter_stream_tube_add, config.link_tube, self.addNewUser);
  this.jobber_gt = require('../../common/beanstalk/jobs.js').create(config.twitter_stream_tube_add, 'link_processing_gt', self.addNewUser);
  //but never poolect jobber gt
  this.jobber.poolect(40, function(){
    console.log('jober poolected');
    self.jobber_gt.poolect(40, function(){
      console.log('jobber_gt poolected');
      cb();
      self.jobber.reserve(function(){
        console.log('jobber reserved');
      });
    });
  });
};

/*
 * Adds user to redis set if necessary
 * @param job : object : beanstalk job
 * @param deleteJob : function : remove this job from queue
 */
TwitterStream.prototype.addNewUser = function(job, deleteJob){
  var self = this;
  console.log('NEW USR:', job);
  /*redis.sismember(config.redis_config.stream_key, job.twitter_id, function(err, res){
    if (res/1){
      util.log({"status":'user already in stream', "twitter_id":job.twitter_id});
      return deleteJob();
    } else {*/
      util.log({"status":"Adding stream from beanstalk", "type":"stream"});
      redis.sadd(config.redis_config.stream_key, job.twitter_id, function(){
        return deleteJob();
      });
   // }
  //});
};

/*
 * Parse a tweet for urls
 * @param tweet : object : the JSON object representing a tweet
 */
TwitterStream.prototype.parseTweet = function(tweet){
  var self = this;
  if (tweet.message && tweet.message.event && (tweet.message.event == 'unfollow')){
    self.trigger('unfollow:parsed', tweet.message.source.id_str, tweet.message.target.id_str);  
  }else if (tweet.message && tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length){
    for (var i in tweet.message.entities.urls){
      if (tweet.message.entities.urls.hasOwnProperty(i)){
        self.trigger('tweet:parsed', tweet.message, tweet.message.entities.urls[i], tweet.for_user);
      }
    }
  }
};

/*
 * Initialize a site-stream w/ twitter
 * @param following : array : Array of users for this stream to track
 */
TwitterStream.prototype.defineStream = function(following){
  var self = this;
  var twit = new twitter_client(config.twitter_keys);
  twit.stream('site', {"follow":following, "with":'followings'}, function(stream){
    var stream_object = {
      "stream":stream,
      "following":following
    };

    following.length == config.twitter_stream_limit ? self.full_streams.push(stream_object) : self.partial_streams.push(stream_object);

    stream.on('data', function (data) {
      return self.parseTweet(data);
    });

    stream.on('end', function(data) {
      self.trigger('disconnect');
      console.log('--DISCONNECT--');
    });

    stream.on('error', function(data){
      console.log('ERROR:', data);
    });
  });
};

/*
 * Places a link processing job on the queue
 * @param tweet : object : the tweet containing the url to be processed
 * @param url : string : the url to be processed
 * @param twitter_id : int : the twitter id of the user who received tweet
 */
TwitterStream.prototype.buildJob = function(tweet, url, twitter_id){
  var self = this;
  url = url.expanded_url ? url.expanded_url : url.url;
  var job_spec = {
     "twitter_status_update":tweet,
     "url":url,
     "provider_type":"twitter",
     "provider_user_id":twitter_id
  };
//DS - used to put NOS jobs, flipping it to put only GT jobs w/ nos commented out
  /*self.jobber.put(job_spec, function(){
    self.jobsBuilt+=1;
  });*/
  self.jobber_gt.put(job_spec, function(r){
    self.jobsBuiltGt+=1;
  });
};

/*
 * Places an unfollow job in resque
 * @param unfollowerUid : string : the twitter id of the user who did the unfollowing
 * @param unfolloweeUid : string : the twitter id of the user who was unfollowed
 */
TwitterStream.prototype.buildUnfollowResqueJob = function(unfollowerUid, unfolloweeUid){
  resque.enqueue('twitter_unfollow', 'TwitterUnfollowChecker', [unfollowerUid, unfolloweeUid]);
  this.jobsBuiltUnfollow+=1;
}
   
/*
 * Chunkize ids into config.twitter_stream_limit sized arrays
 * @param ids : array : Array of ids to chunkize
 */
TwitterStream.prototype.chunkizeFollowers = function(ids){
  var self = this;
  if (ids.length===0) return;

 var id_arrays = [];
  while (ids.length>config.twitter_stream_limit){
    id_arrays.push(ids.splice(0,config.twitter_stream_limit));
  }
 id_arrays.push(ids); //the remainder
 var rateMaker = function(){
   setInterval(function(){
     var stream_ids = id_arrays.shift();
     if (!stream_ids) {return clearInterval(this);}
     self.trigger('stream:followers', stream_ids);
   },100);
 };
  rateMaker();
};

/*
 * Grab all stream users from redis
 */
TwitterStream.prototype.getAllStreamUsers = function(){
  var self = this;
  redis.sort(config.redis_config.stream_key, this.sortOrder, function(err, stream_ids){
    self.userCount = stream_ids.length;
    if (!err) {return self.trigger('redis:all_users', stream_ids);}
  });
};

//////////////////////////////////////////////////////////
exports.create = function(sort_order){
  var micro = require('../../common/micro/microevent.js');
  micro.mixin(TwitterStream);
  return new TwitterStream(sort_order);
};

