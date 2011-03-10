//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk_client.js').Client(config.beanstalkd_uri);
//.........//

var message = //this is a sample job - and the key names need to change for twitter.js
{
  "action":"add_user", 
  "twitter_id":"8180"
};

bs.use(config.twitter_stream_tube_add).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{
	  	bs.disconnect();
	});
});
