var config = require('../common/config.js');
var util = require('../common/util.js');
var facebookClient = require('facebook-js')(config.facebook.app_id, config.facebook.app_secret);
var fb_dao = require('./lib/facebook_dao.js');
var jobber = require('../common/beanstalk/jobber.js');

/*
* Initialize facebook metadata in redis (if user does not exist)
* job : obj : beanstalk job
* deleteJobAndListen : function : delete current job from bs
*/
function initFbUser(job, deleteJobAndListen)
{
  job = JSON.parse(job.data);
  console.log(job);
  
  fb_dao.userIsInSet(job.fb_id, function(is_in_set)
  {
    if (is_in_set)
    {
      util.log({"status":"user already in set, deleting job"});
      deleteJobAndListen();
    }
    else
    {
      fb_dao.setUserInfo(job.fb_id, {"facebook_id":job.fb_id, "access_token":job.fb_access_token, "last_seen":0}, function(err, res)
      {
        if (err && !res) {util.log({"error":"user info not set"});deleteJobAndListen();return;}
        getFeed(job.fb_id, deleteJobAndListen);
        //2.wait for group interval
      });  
    }
  });
}

/*
* Make API call to facebook to get a given users feed
* user_id : int || string : user facebook id
* deleteJobAndListen : function : delete current job from bs
*/
function getFeed(user_id, deleteJobAndListen)
{ 
  fb_dao.getUserInfo(user_id, function(err, info)
  {
    if (err && (!info || !info.length==3)) {util.log({"status":"ERR:info bad or not found"});deleteJobAndListen();return;}
    
    facebookClient.apiCall('GET','/'+user_id+'/home', {since:info.last_seen, access_token: info.access_token, fields:'type,source,name,from', limit:1000}, function(err, feed)
    {
      if (err && (!feed || !feed.data)) {util.log({"status":"ERR:bad API call or no new feed data"});deleteJobAndListen();return;}
      util.getTimestamp('s', function(ts)
      {
        fb_dao.setUserProperty(user_id, 'last_seen', ts, function(err, res)
        {
          if (err && !res){callback('ERR:last_seen not set', null); return;}
          deleteJobAndListen();
          parseFeed(feed, user_id);  
        });
      });
    });          
  });
}

/*
* Validate presence of feed data - delete job - pass each element to addLinkToQueue
* feed : obj : all metadata for facebook update
* user_id : int || string : facebook user id
* deleteJobAndListen : function : delete current job from bs
*/
function parseFeed(feed, user_id)
{ 
  var videos = [];
  var feed_length = feed.data.length;
  
  if (feed && feed.data && feed.data.length)
  {
    util.log({"status":"feed retrieved now parsing", "type":"fb_feed"});     
    for (var i in feed.data)
    {
      if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source)
      {
	      addLinkToQueue(feed.data[i], user_id);
      }	
    }	
  }

}

/*
* Put the job specification on beanstalk
* feed_obj : obj : the facebbok status update
* user_id : string || int : facebook user id
*/
function addLinkToQueue(feed_obj, user_id)
{
  var job_spec =
  {
     "facebook_status_update":feed_obj,
     "url":feed_obj.source,
     "provider_type":"facebook",
     "provider_user_id":user_id
  };
  
  console.log(job_spec);
  jobber.putJob(job_spec, function(data)
  {
    //do nothing
  });
}

/*
* Grab user set from redis and get each users since last seen feed.
*/
function getAllUserFeeds()
{
  fb_dao.getUserSet(function(err, members)
  {
    if (err || !members.length) {util.log({status:"error retrieving fb users or no users", type:"fb_feed"});return;}
    util.log({status:'initializing facebook polling from redis'});
    for (var i in members)
    {
      getFeed(members[i], function(err, res)
      {
        if (err)
        {
          util.log(err)
        }
        else if (res)
        {
          util.log(res);
        }
      });
    }
  });  
}

/*
* Initialization sequence
--------------------------
* 1. Grab all feeds
* 2. Attach listener to job queue
* 3. setInterval (polling the fb api)
*/

getAllUserFeeds();

jobber.init(10, config.facebook.tube_add, config.twitter_link_tube, function()
{
  jobber.resJob(initFbUser);
});

setInterval(function()
{
  getAllUserFeeds();
}, 60000);


