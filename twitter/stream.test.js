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
var twit_id = '251386798';

console.log('initializing stream for '+twit_id);
twit.stream('site', {follow:[twit_id]}, function(stream)
{ 
    stream.on('data', function (data) 
    {
        util.log(data);
    });
    
    stream.on('end', function(data)
    {
      console.log('stream disconnected...');
    });

});
