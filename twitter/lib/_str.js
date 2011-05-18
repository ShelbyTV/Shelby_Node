var config = require('../../common/config.js');
//var twitter_client = require('./node-twitter-2/lib/twitter.js');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

var TwitterStream = function(){
  //init
};
/*
 * Initialize a site-stream w/ twitter
 * @param following : array : Array of users for this stream to track
 */
TwitterStream.prototype.defineStream = function(following){
  var self = this;
  var twitter_client = require('./node-twitter-2/lib/twitter.js');
  var twit = new twitter_client(config.twitter_keys);   
  twit.stream('site', {"follow":following, "with":'followings'}, function(stream){   
    
    stream.on('data', function (data) {
      //console.log('DATA FOR', following);
    });

    stream.on('end', function(data) { 
      console.log('DISCONNECT', following);
    });

    stream.on('error', function(data){
      console.log('ERROR:', data);
    });

    if (following[0]==8180){
      setTimeout(function(){
        stream.destroy();
      }, 5000);
    }

  }); 
};

/*
 * Grab all stream users from redis
 */
TwitterStream.prototype.getAllStreamUsers = function(callback){
  var self = this;
  redis.sort(config.redis_config.stream_key, 'ASC', function(err, stream_ids){
    if (!err) {return callback(stream_ids);}
  });
};


var Stream = new TwitterStream();
////////////////////////////////////////
Stream.getAllStreamUsers(function(users){
  users.forEach(function(uid){
    Stream.defineStream([uid]);  
  });
});
