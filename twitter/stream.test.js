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
var twit_ids = ['251386798', '17368581'];

console.log('initializing streams for:');
for (var i in twit_ids)
{
  console.log(twit_ids[i])
}
twit.stream('site', {follow:twit_ids}, function(stream)
{ 
    stream.on('data', function (data) 
    {
      util.log(data);
    });
    
    stream.on('end', function(data)
    {
      util.log('stream disconnected...');
    });

});
