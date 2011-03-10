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

function parseSiteStreamTweet(tweet)
{
  var twitter_user_id = tweet.for_user;
  var urls = null;
  if (tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length)
  {
    urls = tweet.message.entities.urls;
    util.log('URLS ARE:');
    util.log(urls);
    for (var u in urls)
    { 
      var url = urls[u].expanded_url ? urls[u].expanded_url : urls[u].url;
      util.expandURL(url, tweet.message, function(expanded, tweet_msg)
      {
        var job_spec =
        {
	         "twitter_status_update":tweet_msg,
           "url":expanded,
           "provider_type":"twitter",
           "provider_user_id":twitter_user_id
        };
        util.log('ADDING '+expanded+' TO '+twitter_user_id);
        job_manager.addJob(config.twitter_link_tube, job_spec, function(job_data)
        {
	        util.log({status:'link proccess job added', url:job_spec.url, type:'backfill', job_id:job_data}); 
        });    
      });
    }
  }
  
}

function compactStreams()
{
  util.log('...COMPACTING...');
  
  var full_streams_fork = full_streams.splice(0, full_streams.length);
  var partial_streams_fork = partial_streams.splice(0, partial_streams.length);
  
  for (var i in full_streams_fork)
  {
    full_streams_fork[i].stream.destroy;
  }
  
  for (var j in partial_streams_fork)
  {
    partial_streams_fork[j].stream.destroy;
  }
  
  full_streams_fork = null;
  partial_streams_fork = null;
  
  //util.log('FULL STREAM SIZE NOW: '+full_streams.length);
  //util.log('PARTIAL STREAM SIZE NOW: '+partial_streams.length);
  
  getAllStreamUsers(buildStream); 
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
    twit.stream('site', {follow:id_arrays[i], with:'followings'}, function(stream)
    {   
        var stream_object = 
        {
          "stream":stream,
          "following":id_arrays[i]
        }
        
        if (id_arrays[i].length==config.twitter_stream_limit)
        {
          full_streams.push(stream_object);
        }
        else
        {
          partial_streams.push(stream_object);
        }
        
        stream.on('data', function (data) 
        {
          parseSiteStreamTweet(data);
        });

        stream.on('end', function(data)
        {
          util.log('stream disconnected...');
        });
        
        if (job_id)
        { 
          redis.sadd(config.redis_config.stream_key, ids[0], function(err, res)
          {
            job_manager.deleteJob(job_id, function(res)
            {
              initJobs();
            });
          });
        }

    });    
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
      util.log('ADDING STREAM FROM JOB QUEUE');
      buildStream([job_data.twitter_id], job.id);
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
}, 4000);

