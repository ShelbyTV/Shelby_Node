//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk_client.js').Client(config.beanstalkd_uri);
//.........//

var message = 
  {
    "action":"add_user", 
    "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)),
    "oauth_token":"17368581-s6VAdKTh0pmAA1R439VCwjwuyNcoDX4V55wgPIAZX",
    "oauth_secret":"lEMA5pzMMb04yRRqYigf2DGOyn78Uhpj3h4ODhofNpc"
  };

bs.use(config.twitter_backfill_tube).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{
	  	bs.disconnect();
	});
});
