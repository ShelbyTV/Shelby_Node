//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk/beanstalk_client.js').Client(config.beanstalkd_uri);
//.........//

var message = //this is a sample job - and the key names need to change for twitter.js
{
  "action":"add_user", 
  "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)),
  "oauth_token":"ZmYflNcu4AJz5xyLE2IA5rrdj0M1QwkxQ7CJChAr3xqt2BxvOw",
  "oauth_secret":"Wgvz8WaBkXG08fPbvMPR2QjfMEaiMuvkBL77U8JRQBaSqqlIWg"
};

bs.use(config.tumblr_backfill_tube).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{
	  	bs.disconnect();
	});
});
