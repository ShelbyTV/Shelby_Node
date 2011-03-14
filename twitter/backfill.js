//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//redis//
//var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var job_manager = require('../common/job.manager.js');

var page_start = 17;

/*
* Begin the backfill proccess. Named start due to asyncness
*/
function startBackfill(twit_client, twitter_user_id, job_id)
{
  
  var page_counter = 0;
  
  for(var p=page_start; p>0; p-=1)
  { 
    util.log({status:'retrieving pages', type:'backfill', job_id:job_id, twitter_id:twitter_user_id})
    
    getPage(twit_client, p, function(page)
    {
      page_counter+=1;
      if (page_counter==17) 
      {
	      gotAllPages(twit_client, job_id);
      }
      
      getPageLinks(page, function(link, tweet)
      {
        addLinkToQueue(link, tweet, twitter_user_id);
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

  job_manager.addJob(config.twitter_link_tube, job_spec, function(job_data)
  {
    util.log({status:'link proccess job added', job_id:job_data}); 
  });
}

/*
* Get the page_num page for a given user (oauth in the twit_client)
*/
function getPage(twit_client, page_num, callback)
{
  twit_client.get('/statuses/home_timeline.json', {include_entities:true, count:200, page:page_num}, function(page) 
  {   
      callback(page);
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
        util.expandURL(url, page[i], function(expanded, tweet)
        {
          linkExtractedCallback(expanded, tweet);    
        });
    }
  }
}

/*
* A callback when all pages for a given job have been retreived
*/
function gotAllPages(twit_client, job_id)
{
  util.log('GOT ALL PAGES CALLED');
  util.log('JOB ID IS: '+job_id)
  //twit_client = null; //does this actually work?
  util.log({status:'all pages retrieved', type:'backfill', "job_id":job_id});

  job_manager.deleteJob(job_id, function(job_del_data)
  { 
    listen();
  });
}

/*
* Get Twitter Client and pass it to startBackfill
*/
function addUser(job_id, job_data)
{
  util.log({status:'commencing new job', type:'backfill', job_id:job_id, twitter_id:job_data.twitter_id});
  initTwitterClient(job_data, function(twitter_client)
  {
    startBackfill(twitter_client, job_data.twitter_id, job_id);
  });
}

/*
* Create a new twitter client and pass it to startbackfill pre-func
*/
function initTwitterClient(job_data, _startBackfill)
{
  var twit_cfg = config.twitter_keys;
  twit_cfg.access_token_key = job_data.oauth_token;
  twit_cfg.access_token_secret = job_data.oauth_secret;
  var twitter_client = new twitter(twit_cfg);
  _startBackfill(twitter_client);
}

/*
* Switch for the job action and execute the corresponding function
*/
function proccessNewJob(job)
{
  var job_data = eval('(' + job.data + ')');
  
  switch(job_data.action)
  {
    case 'add_user':
    addUser(job.id, job_data);
    break;
  }
}

/*
* Listen for new add_user jobs
*/
function listen()
{
  job_manager.listenForJobs(config.twitter_backfill_tube, proccessNewJob);
}

listen();





