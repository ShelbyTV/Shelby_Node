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

function parseSiteStreamTweet(tweet)
{
  var urls = null;
  if (tweet.message.entities && tweet.message.entities.urls && tweet.message.entities.urls.length)
  {
    urls = tweet.message.entities.urls;
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
           "provider_user_id":tweet.for_user
        };
        
        job_manager.addJob(config.twitter_link_tube_add, job_spec, function(job_data)
        {
	        //util.log({status:'link proccess job added', url:job_spec.url, type:'stream', job_id:job_data}); 
        });    
      });
    }
  }
  
}

twit.stream('site', {follow:[251386798], with:'followings'}, function(stream)
{   
    
    stream.on('data', function (data) 
    {
      parseSiteStreamTweet(data);
    });

    stream.on('end', function(data)
    {
      util.log('stream disconnected...');
    });

});


