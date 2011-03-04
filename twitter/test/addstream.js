//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk_client.js').Client();
//.........//

var message = {"action":"add_user", "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000))};

bs.use(config.twitter_stream_tube).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{ 
	    util.log(data);
	  	bs.disconnect();
	});
});
