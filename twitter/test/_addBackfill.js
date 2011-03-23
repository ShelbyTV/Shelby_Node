var config = require('../../common/config.js');
var job_king = require('../../common/job.king.js');

var job = //this is a sample job - and the key names need to change for twitter.js
{
  "action":"add_user", 
  "twitter_id":(Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)),
  "oauth_token":"232439599-MrVUudnONywl0a1KY9XEYwDH3neNv1ESp4l8OU",
  "oauth_secret":"Cio44HxikuDcJM7UvkhlXL3zVCSFrjZ80I7gZikToaw"
};

job_king.init(config.twitter_backfill_tube, function(){}, config.twitter_link_tube, function()
{
  job_king.JSONspawnClientToPut('tw_backfill', job);
});
