//config//
var config = require('../config.js');
//util//
var util = require('../util.js');
//beanstalk//
var bs = require('../beanstalk/beanstalk_client.js').Client(config.beanstalkd_uri);
//.........//

var message = //this is a sample job - and the key names need to change for twitter.js
{
  "action":"new_video", 
  "user_id":process.argv[2],
  "payload":JSON.stringify({"url":"http://www.youtube.com/watch?v=1pBkBhE7T10&feature=topvideos"})
};

bs.use(config.websocket.tube).onSuccess(function(data) 
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