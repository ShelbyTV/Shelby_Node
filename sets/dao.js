var redis = require('redis').createClient(config.sets.redis_port, config.sets.redis_server);
function DAO(){
  
  this.addMember = function(host, host_id, member, member_id, callback){
   var key = host+':'+host_id+':'+member+'s';
   var value = member_id;
   return redis.sadd(key, value, callback);
  }; 
}

exports.getDao = function(){
  return new DAO();
};