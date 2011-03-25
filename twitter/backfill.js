//profiler///
//var profiler = require('v8-profiler');
//profiler.startProfiling('startup');
//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//beanstalkd//
var jobber = require('../common/beanstalk/jobber.js');

var page_start = 17;

/*
* Begin the backfill proccess. Named start due to asyncness
*/
function startBackfill(twit_client, twitter_user_id, deleteJobAndListen)
{  
  var page_counter = 0;
  
  for(var p=page_start; p>0; p-=1)
  { 
    util.log({status:'retrieving pages', type:'backfill', twitter_id:twitter_user_id})
    
    getPage(twit_client, p, function(page)
    { 
      page_counter+=1;
      
      if (page_counter==17) 
      { 
        twit_client = null;
        deleteJobAndListen();
      }
      
      getPageLinks(page, function(link, tweet)
      {
        return addLinkToQueue(link, tweet, twitter_user_id);
      });
    });
  }  
}

/*
* Throw a proccessed link back on the queue
*/
function addLinkToQueue(link, tweet, twitter_id)
{
  var job_spec =
  {
     "twitter_status_update":tweet,
     "url":link,
     "provider_type":"twitter",
     "provider_user_id":twitter_id
  };

  jobber.putJob(job_spec, function(data)
  {
    return;
  });
}

/*
* Get the page_num page for a given user (oauth in the twit_client)
*/
function getPage(twit_client, page_num, callback)
{
  twit_client.get('/statuses/home_timeline.json', {include_entities:true, count:200, page:page_num}, function(page) 
  {   
      return callback(page);
  });  
  
}

/*
* Get all links on a given page
*/
function getPageLinks(page, linkExtractedCallback)
{ 
  for (var i in page)//foreach tweet in page
  { 
    if (page[i] && page[i].entities && page[i].entities.urls && page[i].entities.urls.length)
    { 
        var url = page[i].entities.urls[0].expanded_url ? page[i].entities.urls[0].expanded_url : page[i].entities.urls[0].url;
        linkExtractedCallback(url, page[i]);
    }
  }
}

/*
* Get Twitter Client and pass it to startBackfill
*/
function addUser(job_data, deleteJobAndListen)
{
  util.log({status:'commencing new job', type:'backfill', twitter_id:job_data.twitter_id});
  initTwitterClient(job_data, function(twitter_client)
  {
    return startBackfill(twitter_client, job_data.twitter_id, deleteJobAndListen);
  });
}

/*
* Create a new twitter client and pass it to startbackfill pre-func
*/
function initTwitterClient(job_data, _startBackfill)
{
  //var twit_cfg = config.twitter_keys;
  var twit_cfg = {};
  twit_cfg.access_token_key = job_data.oauth_token;
  twit_cfg.access_token_secret = job_data.oauth_secret;
  var twitter_client = new twitter(twit_cfg);
  return _startBackfill(twitter_client);
}

/*
* Switch for the job action and execute the corresponding function
*/
function proccessNewJob(job, deleteJob)
{ 
  
  job.data = JSON.parse(job.data);
  switch(job.data.action)
  { 
    case 'add_user':
    addUser(job.data, deleteJob);
    break;
  }
} 

//job_king.init(config.twitter_backfill_tube, proccessNewJob, config.twitter_link_tube, job_king.spawnClientToRes);
jobber.init(10, config.twitter_backfill_tube, config.twitter_link_tube, function()
{
  return jobber.resJob(proccessNewJob)
});




