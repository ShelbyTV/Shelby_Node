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

function parseSiteStreamTweet(data)
{
  console.log('TWEET!');
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


