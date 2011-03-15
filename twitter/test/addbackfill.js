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
  "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)),
  "oauth_token":"232439599-MrVUudnONywl0a1KY9XEYwDH3neNv1ESp4l8OU",
  "oauth_secret":"Cio44HxikuDcJM7UvkhlXL3zVCSFrjZ80I7gZikToaw"
};

bs.use(config.twitter_backfill_tube).onSuccess(function(data) 
{
	bs.put(JSON.stringify(message)).onSuccess(function(data)
	{
	  	bs.disconnect();
	});
});

/*
"oauth_token":"250202787-MvZk6aGMDlNvAZPUtQBjexjcZ0HRxDAVmrraPGGP",
 "oauth_secret":"xG8jShVGQIcdF6rNJ21DtH40w08tCXIcK7AJBrFZdM"
 */