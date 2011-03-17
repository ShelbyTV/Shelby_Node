var express = require('express'),
    connect = require('connect'),
    facebookClient = require('facebook-js')(
      '115071338568035',
      '416ce973e4a78ca6a99227731946b27b'
    ), 
    redis = require('redis').createClient();

function getFeed(user_id, callback)
{ //fb_dao..get_user_data - returns a hash
  getAccessToken(user_id, function(err, token)
  { console.log('got access token::'+token);
    if (err && !token) {callback('ERR:not found', null);return;}
    //fb_dao.getLastSeen(user_id, function(err, res))
    facebookClient.apiCall('GET','/'+user_id+'/home', {since:0, access_token: token, fields:'type,source,name,from,name,comments', limit:1000}, function(err, res)
    {
      if (err && !res) {callback('ERR:not found', null);return;}
      console.log('FEED LENGTH:' +res.data.length);
      console.log(res.paging);
      //mark last_seen in redis
      parseFeed(res, proccessLink);
    });      
  });
}

function getAccessToken(user_id, callback)
{
  //redis.hget('fb_tokens', user_id, callback);
  callback(null, '115071338568035|cf4da0397104a7a50b4cda8b-1319152|hymtzZncfOtETKwLh84fnI7y4ZE');
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
	      videos.push(feed.data[i]);
      }
      
      inspected+=1;
            
      if (inspected==feed.data.length)
      { 
        console.log(videos);
      }	
    }	
  }

}

function proccessLink(feed_obj)
{
  console.log(feed_obj);
}

getFeed('1319152', console.log);
