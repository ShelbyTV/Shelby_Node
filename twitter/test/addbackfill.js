//config//
var config = require('../../common/config.js');
//util//
var util = require('../../common/util.js');
//beanstalk//
var bs = require('../../common/beanstalk_client.js').Client();
//.........//

var message = {
  "action":"add_user", 
  "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)),
  "oauth_token":"232439599-8Ji6In1HvmOuXiYh24iCA6kYasGfPMiS96FgPMCV",
  "oauth_secret":"wOSnCeZqXJYQXXOZ4PVtmHAICR9WUvJTbY6e9mKLkQ"
  };

bs.use(config.twitter_backfill_tube).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{ 
	    util.log(data);
	  	bs.disconnect();
	});
});
