//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk_client.js').Client(config.beanstalkd_uri);
//.........//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

bs.use(config.twitter_stream_tube_add).onSuccess(function(data) 
{
  redis.smembers(config.redis_config.stream_key, function(err, users)
  {
    for (var i in users)
    {
      bs.put(JSON.stringify({"action":"add_user", "twitter_id":users[i]})).onSuccess(function(data)
    	{
    	  	bs.disconnect();
    	});
    }
  });		

});
