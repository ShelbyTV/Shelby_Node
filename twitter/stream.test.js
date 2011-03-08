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


twit.stream('site', {follow:[251386798]}, function(stream)
{ 
    stream.on('data', function (data) 
    {
        util.log(data);
    });
  
});