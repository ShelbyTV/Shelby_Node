var config = require('../../common/config.js');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

redis.hgetall('test', function(err,res)
{
  console.log(res);
});