//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//redis//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var job_manager = require('../common/job.manager.js');
var twit = new twitter(config.twitter_keys);

var full_streams = [];
var partial_streams = [];

var should_compact = false;

function parseSiteStreamTweet(tweet)
{
  if (tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length)
  {
    var url = tweet.message.entities.urls[0];
    url = url.expanded_url ? url.expanded_url : url.url;
    util.expandURL(url, tweet.message, function(expanded, tweet_msg)
    {
      
      util.log('BUILDING JOB SPEC FOR '+tweet.for_user);
      
      var job_spec =
      {
         "twitter_status_update":tweet_msg,
         "url":expanded,
         "provider_type":"twitter",
         "provider_user_id":tweet.for_user
      };
      
      job_manager.addJob(config.twitter_link_tube, job_spec, function(job_data)
      {
        //do nothing
      });    
    });
  }
  
}

function compactStreams()
{
  if (!should_compact) return;
  
  util.log('...COMPACTING...');
  
  var partial_streams_fork = partial_streams.splice(0, partial_streams.length);

  var all_partial_ids = [];
    
  for (var j in partial_streams_fork)
  { 
    partial_streams_fork[j].intent_to_term = true;
    all_partial_ids = all_partial_ids.concat(partial_streams_fork[j].following);  
    partial_streams_fork[j].stream.destroy();
    partial_streams_fork[j].intent_to_term = false;
  }  
    partial_streams_fork = null;
    buildStream(all_partial_ids); 
    should_compact = false;  
}

function defineStream(following, job_id)
{
  twit.stream('site', {follow:following, with:'followings'}, function(stream)
  {   
      var stream_object = 
      {
        "stream":stream,
        "following":following,
        "intent_to_term":false
      }
      
      if (following.length==config.twitter_stream_limit)
      {
        full_streams.push(stream_object);
        stream_object.container = full_streams;
      }
      else
      {
        partial_streams.push(stream_object);
        stream_object.container = partial_streams;
      }
      
      stream.on('data', function (data) 
      {
        parseSiteStreamTweet(data);
      });

      stream.on('end', function(data)
      { 
        if (stream_object.intent_to_term)
        {
          util.log('INTENTIONAL termination...ignoring...');
          return;
        } 
        
        util.log('stream died naturally exiting...');
        var stream_to_kill = removeElFromArray(stream_object, stream_object.container);
        stream_to_kill = null;
        //process.exit();
        buildStream(following);
      });
            
      if (job_id)
      { 
        redis.sadd(config.redis_config.stream_key, following[0], function(err, res)
        {
          job_manager.deleteJob(job_id, function(res)
          {
            initJobs();
          });
        });
      }

  });  
}

function removeElFromArray(el, arr)
{
  for (var i in arr)
  {
    if (arr[i]==el)
    {
      return arr.splice(i,1)[0];
    }
  }
  return false;
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
           initJobs();
         });
        }
        else
        {
          util.log({"status":"Adding stream from beanstalk", "type":"stream"});
          should_compact = true;
          buildStream([job_data.twitter_id], job.id);
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
      callback(stream_ids);
    }
  });  
}


getAllStreamUsers(buildStream);
initJobs();
setInterval(compactStreams, 10000);

setInterval(function()
{
  util.log('FULL STREAMS: '+full_streams.length);
  util.log('PARTIAL STREAMS: '+partial_streams.length);
  for (var i in partial_streams)
  {
    util.log
  }
}, 10000);

/*
setTimeout(function(){
  partial_streams[0].stream.destroy();
}, 25000);
*/
