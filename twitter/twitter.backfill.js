//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
//redis//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var job_manager = require('../common/job.manager.js');

var page_start = 17;

function backfillUser(twit_client, twitter_user_id, job_id)
{
  
  var page_counter = 0;
  
  for(var p=page_start; p>0; p-=1)
  { util.log({status:'retrieving pages', type:'backfill', job_id:job_id, twitter_id:twitter_user_id})
    getPage(twit_client, p, function(page)
    {
      page_counter+=1;
      if (page_counter==17) 
      {
	twit_client = null; //little iffy about this one. garbo won't collect til all refs are nullified
        util.log({status:'all pages retrieved', type:'backfill', job_id:job_id, twitter_id:twitter_user_id});
        job_manager.deleteJob(job_id, function(job_del_data)
        {
	  listen();
        });
      }
      getPageLinks(page, function(link, tweet, linkCallback)
      { 
        var job_spec =
        {
	 "twitter_status_update":tweet,
         "url":link,
         "provider_type":"twitter",
         "provider_user_id":twitter_user_id
        };
        
        job_manager.addJob(config.twitter_link_tube, job_spec, function(job_data)
        {
	  util.log({status:'link proccess job added', url:job_spec.url, type:'backfill>>link_processing', job_id:job_data}); 
        });
      });
    });
  }  
}

function getPage(twit_client, page_num, callback)
{
  twit_client.get('/statuses/home_timeline.json', {include_entities:true, count:200, page:page_num}, function(page) 
  { 
      callback(page);
  });  
  
}

function getPageLinks(page, linkExtractedCallback)
{
  for (var i in page)//foreach tweet in page
  { 
    if (page[i] && page[i].entities && page[i].entities.urls)
    {
      for (var u in page[i].entities.urls)
      {
        linkExtractedCallback(page[i].entities.urls[u].url, page[i]);
      }
    }
  }
}

function listen()
{
job_manager.listenForJobs(config.twitter_backfill_tube, function(job, callback) //listen for new jobs
{
  var job_data = eval('(' + job.data + ')');
  switch(job_data.action)
  {
    case 'add_user':
    var twit_cfg = {access_token_key:job_data.oauth_token, access_token_secret:job_data.oauth_secret};
    for (var prop in config.twitter_keys)
    {
      twit_cfg[prop] = config.twitter_keys[prop];
    }
    var twit = new twitter(twit_cfg);
    util.log({status:'commencing new job', type:'backfill', job_id:job.id, twitter_id:job_data.twitter_id});
    backfillUser(twit, job_data.twitter_id, job.id);
    break;
  }
});
}

listen();





