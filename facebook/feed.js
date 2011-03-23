var config = require('../common/config.js');
var util = require('../common/util.js');
var facebookClient = require('facebook-js')(config.facebook.app_id, config.facebook.app_secret);
var fb_dao = require('./lib/facebook_dao.js');
var job_king = require('../common/job.king.js'); 

function initFbUser(job, deleteJobAndListen)
{
  fb_dao.setUserInfo(facebook_id, {"facebook_id":job.facebook_id, "access_token":job.access_token, "last_seen":0}, function(err, res)
  {
    if (err && !res) {callback('ERR:user info not set', null);return;}
    getFeed(facebook_id, deleteJobAndListen);
    //2.wait for group interval
  });
}

/*
* user_id : int || string : user facebook id
*/
function getFeed(user_id, deleteJobAndListen)
{ 
  fb_dao.getUserInfo(user_id, function(err, info)
  {
    if (err && (!info || !info.length==3)) {util.log({"status":"ERR:info bad or not found"});deleteJobAndListen();return;}
    
    facebookClient.apiCall('GET','/'+user_id+'/home', {since:info.last_seen, access_token: info.access_token, fields:'type,source,name,from', limit:1000}, function(err, feed)
    {
      if (err && (!feed || !feed.data)) {callback({"status":"ERR:bad API call or no new feed data"});deleteJobAndListen();return;}
      util.getTimestamp('s', function(ts)
      {
        fb_dao.setUserProperty(user_id, 'last_seen', ts, function(err, res)
        {
          if (err && !res){callback('ERR:last_seen not set', null); return;}
          parseFeed(feed, deleteJobAndListen);  
        });
      });
    });          
  });
}

function parseFeed(feed, deleteJobAndListen)
{ 
  var videos = [];
  var feed_length = feed.data.length;
  
  if (feed && feed.data && feed.data.length)
  {
    util.log({status:'feed retrieved - now parsing', type:'fb_feed'}); 
    deleteJobAndListen();
    
    for (var i in feed.data)
    {
      if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source)
      {
	      proccessLink(feed.data[i]);
      }	
    }	
  }

}

function proccessLink(feed_obj)
{ 
  //TODO: place job on queue 
  console.log(feed_obj);
}

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

getAllUserFeeds();
job_king.spawnClientToRes(config.facebook.tube_add, initFbUser);

