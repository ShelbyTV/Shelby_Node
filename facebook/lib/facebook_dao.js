var config = require('../../common/config.js');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

function getUserInfoKey(facebook_id)
{
  return 'fbusr:'+facebook_id+':info';
}

function getUserSetKey()
{
  return 'fb_users';
}

function addUserToSet(facebook_id, callback)
{
  redis.sadd(getUserSetKey, facebook_id, callback);
}
exports.getUserInfo = function(facebook_id, callback)
{
  redis.hgetall(getUserInfoKey(facebook_id), callback);
}

exports.setUserInfo = function(facebook_id, info_hash, callback)
{
  redis.hmset(getUserInfoKey(facebook_id), info_hash, callback);
}

exports.setUserProperty = function(facebook_id, property, value, callback)
{
  redis.hset(getUserInfoKey, property, value, callback);
}


//{"facebook_id":facebook_id, "access_token":access_token, "last_seen":last_seen}