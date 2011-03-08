//config//
var config = require('../common/config.js');
//util//
var util = require('../common/util.js');
//twitter//
var twitter = require('./lib/node-twitter/lib/twitter.js');
var twit = new twitter(config.twitter_keys);
//redis//
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);
//beanstalkd//
var job_manager = require('../common/job.manager.js');

//........////these need to be initialized from redis
var full_streams = [];
var partial_streams = [];
//........//


function addUser(twitter_id, callback)
{
  util.log('adding user '+twitter_id);
  buildStreams([twitter_id], function()
  {
    
  });
}

function buildStreamsSuccess(err, twitter_id, callback)
{ 
  if (err)
  {
    util.log('buildStreams failed');
    //now put job back on queue 
    return;
  }
  util.log('build streams finished');
  
  redis.sadd(config.twitter_stream_redis_key, twitter_id, function(err, res)
  {
    callback(); //this deletes job
  });
  
}


function buildStream(ids, callback)
{
  /*
  var id_arrays = [];
  while (ids.length>config.twitter_stream_limit)
  {
    id_arrays.push(ids.splice(0,config.twitter_stream_limit));
  }
  id_arrays.push(ids); //one id_arr for each stream
  
  var iterator = function(id_arr, atomic_callback)
  {
    twit.stream('site', {follow:id_arr}, function(stream)
    { 
      var stream_obj = {"stream":stream, "ids":id_arr};
      id_arr.length==100 ? full_streams.push(stream_obj) : partial_streams.push(stream_obj);
      stream.on('data', function (data) 
      {
          util.log('...incoming data');
      });
      atomic_callback();  
    }); 
  }*/
  //util.log(id_arrays);
  //util.async.forEach(id_arrays, iterator, callback);  
  
  twit.stream('site', {follow:ids}, function(stream)
  { 
    //var stream_obj = {"stream":stream, "ids":id_arr};
    //id_arr.length==100 ? full_streams.push(stream_obj) : partial_streams.push(stream_obj);
    stream.on('data', function (data) 
    {
        util.log(data);
    });
  
}

function compactStreams()
{
  util.log('compacting streams...');
}

function initJobs()
{
  job_manager.listenForJobs(config.twitter_stream_tube, function(job, callback) //listen for new jobs
  {
    var job_data = eval('(' + job.data + ')');
    switch(job_data.action)
    {
      case 'add_user':
      addUser(job_data.twitter_id, callback);
      break;
    } 
  });  
}

//redis.smembers(config.twitter_stream_redis_key, function(err, users) //get all users
//{
  //buildStreams(users , function() //build streams with users
  //{
    
    initJobs();
    //setInterval(compactStreams, 2000);
     
  //});
//});


