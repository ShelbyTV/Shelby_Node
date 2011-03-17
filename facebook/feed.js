var config = require('../common/config.js');
var util = require('../common/util.js');
var facebookClient = require('facebook-js')(config.facebook.app_id, config.facebook.app_secret);
var fb_dao = require('./lib/facebook_dao.js');
var job_manager = require('../common/job.manager.js');

function initFbUser(facebook_id, access_token, job_id, callback)
{
  fb_dao.setUserInfo(facebook_id, {"facebook_id":facebook_id, "access_token":access_token, "last_seen":0}, function(err, res)
  {
    if (err && !res) {callback('ERR:user info not set', null);return;}
    getFeed(facebook_id, callback);
    //2.wait for group interval
  });
}

/*
* user_id : int || string : user facebook id
*/
function getFeed(user_id, callback)
{ 
  fb_dao.getUserInfo(user_id, function(err, info)
  {
    if (err && (!info || !info.length==3)) {callback('ERR:info bad or not found', null);return;}
    
    facebookClient.apiCall('GET','/'+user_id+'/home', {since:info.last_seen, access_token: info.access_token, fields:'type,source,name,from', limit:1000}, function(err, feed)
    {
      if (err && (!feed || !feed.data)) {callback('ERR:bad API call or no feed data', null);return;}
      util.getTimestamp('s', function(ts)
      {
        fb_dao.setUserProperty(user_id, 'last_seen', ts, function(err, res)
        {
          if (err && !res){callback('ERR:last_seen not set', null); return;}
          parseFeed(feed, callback);  
        });
      });
    });          
  });
}

function parseFeed(feed, callback)
{ 
  var inspected = 0;
  var videos = [];
  var feed_length = feed.data.length;
  
  if (feed && feed.data && feed.data.length)
  {
    for (var i in feed.data)
    {
      if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source)
      {
	      proccessLink(feed.data[i]);
      }
      
      inspected+=1;
            
      if (inspected==feed.data.length)
      { 
        callback(null, 1); //jobDeletion..
      }	
    }	
  }

}

function proccessLink(feed_obj)
{
  console.log(feed_obj);
}

function initJobs()
{
  job_manager.listenForJobs(config.facebook.tube_add, function(job, callback) //listen for new jobs
  {
    var job_data = eval('(' + job.data + ')');
    switch(job_data.action)
    {
      case 'add_user':
      util.log({"status":"Adding facebook user", "type":"fb_feed", "user":job_data.facebook_id});
      initFbUser(job_data.facebook_id, job_data.access_token, job.id, function(err, res)
      {
        if (!err && res)
        {
          //job_manager.deleteJob
        }
        else
        {
          //handle error
        }
      });
      break;
    } 
  });  
}


getFeed('1319152', function(err, res)
{
  console.log('Error:'+err);
  console.log(res);
});

