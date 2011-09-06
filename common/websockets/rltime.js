var redis = require('redis').createClient(6380, '10.180.173.25');
var keyfix = 'vidscore:'

module.exports = {

  flush : function(cb){
    redis.keys(keyfix+'*', function(keys){
      var multi = redis.multi();
      keys.forEach(function(key){

      });   
    });
  },

}
