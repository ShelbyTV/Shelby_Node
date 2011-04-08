//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//redis//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var job_manager = require('../common/beanstalk/job.manager.js');
var twit = new twitter(config.twitter_keys);
//streams//
var full_streams = [];
var partial_streams = [];

function parseSiteStreamTweet(tweet)
{
  if (tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length)
  {
    for (var i in tweet.message.entities.urls)
    {
      buildJob(tweet.message, tweet.message.entities.urls[i], tweet.for_user);
    }     
  }
}

function buildJob(tweet, url, twitter_id)
{
    url = url.expanded_url ? url.expanded_url : url.url;
    var job_spec =
    {
       "twitter_status_update":tweet,
       "url":url,
       "provider_type":"twitter",
       "provider_user_id":twitter_id
    };
    
    job_manager.addJob(config.twitter_link_tube, job_spec, function(job_data)
    {
      return util.log('BUILT JOB FOR '+twitter_id);  
    });
}

function defineStream(following, job_id)
{
  twit.stream('site', {follow:following, with:'followings'}, function(stream)
  {   
      var stream_object = 
      {
        "stream":stream,
        "following":following,
      }
      
      if (following.length==config.twitter_stream_limit)
      {
        full_streams.push(stream_object);
      }
      else
      {
        partial_streams.push(stream_object);
      }
      
      stream.on('data', function (data) 
      {
        return parseSiteStreamTweet(data);
      });

      stream.on('end', function(data)
      { 
        return process.exit();
      });
            
      if (job_id)
      { 
        redis.sadd(config.redis_config.stream_key, following[0], function(err, res)
        {
          job_manager.deleteJob(job_id, function(res)
          {
            return initJobs();
          });
        });
      }

  });  
}

function buildStream(ids, job_id)
{
  if (ids.length==0) return;
  var id_arrays = [];
  while (ids.length>config.twitter_stream_limit)
  {
    id_arrays.push(ids.splice(0,config.twitter_stream_limit));
  }
  
  id_arrays.push(ids); //one id_arr for each stream  
    
  for (var i in id_arrays)
  { 
    util.log('BUILDING STREAM FOR:');
    util.log(id_arrays[i]);
    defineStream(id_arrays[i], job_id);
  }
  
}

function initJobs()
{
  job_manager.listenForJobs(config.twitter_stream_tube_add, function(job, callback) //listen for new jobs
  {
    var job_data = eval('(' + job.data + ')');
    switch(job_data.action)
    {
      case 'add_user':
      redis.sismember(config.redis_config.stream_key, job_data.twitter_id, function(err, res)
      {
        if (res/1)
        {
         util.log({"status":'user already in stream', "twitter_id":job_data.twitter_id}); 
         job_manager.deleteJob(job.id, function(res)
         {
           return initJobs();
         });
        }
        else
        {
          util.log({"status":"Adding stream from beanstalk", "type":"stream"});
          should_compact = true;
          return buildStream([job_data.twitter_id], job.id);
        }
      });
      break;
    } 
  });  
}

function getAllStreamUsers(callback)
{
  redis.smembers(config.redis_config.stream_key, function(err, stream_ids)
  {
    if (!err)
    {
      return callback(stream_ids);
    }
    else
    {
      return util.log({"status":"error", "msg":err});
    }
  });  
}


getAllStreamUsers(buildStream);
initJobs();
setInterval(process.exit, 600000);

setInterval(function()
{
  util.log('FULL STREAMS: '+full_streams.length);
  return util.log('PARTIAL STREAMS: '+partial_streams.length);
}, 10000);
