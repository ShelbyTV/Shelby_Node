var env = process.env.NODE_ENV;
var redis = env==='production' ? require('redis').createClient(6380, '10.180.173.25') : require('redis').createClient();

var keyfix = 'rscore:'

module.exports = {

  scoreItem : function(itemId){
    var itemKey = keyfix+itemId;
    console.log('scoring '+itemId);
  },

  incrTtl : function(itemKey){
         
  }
};
