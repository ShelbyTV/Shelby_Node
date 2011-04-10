var config = require('../common/config.js');
var redis = require('redis').createClient(config.sets.redis_port, config.sets.redis_server);

function DAO(){
  
  this.addMember = function(params, callback){
   var key = params.owner.name+':'+params.owner.val+':'+params.collection.name;
   var value = params.collection.val;
   console.log(key, value);
   return redis.sadd(key, value, callback);
  };
   
}

exports.new = function(){
  return new DAO();
};