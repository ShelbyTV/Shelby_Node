var config = require('../../common/config.js');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

function getUserInfoKey(tumblr_id)
{
  return 'tumblrusr:'+tumblr_id+':info';
}

function getUserSetKey()
{
  return 'tumblr_users';
}

function addUserToSet(tumblr_id, callback)
{
  redis.sadd(getUserSetKey(), tumblr_id, callback);
}

exports.getUserSet = function(callback)
{
  redis.smembers(getUserSetKey(), callback);
};
exports.getUserInfo = function(tumblr_id, callback)
{
  redis.hgetall(getUserInfoKey(tumblr_id), callback);
};

exports.setUserInfo = function(tumblr_id, info_hash, callback)
{ 
  addUserToSet(tumblr_id, function(err, res) {
    redis.hmset(getUserInfoKey(tumblr_id), info_hash, callback);  
  });
};

exports.setUserProperty = function(tumblr_id, property, value, callback)
{
  redis.hset(getUserInfoKey(tumblr_id), property, value, callback);
};

exports.userIsInSet = function(tumblr_id, callback)
{
  redis.sismember(getUserSetKey(), tumblr_id, function(err, res)
  {
    callback(res);
  });
};

//{"tumblr_id":tumblr_id, "access_token":access_token, "last_seen":last_seen}