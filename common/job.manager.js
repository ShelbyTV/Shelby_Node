//util//
var util = require('./util.js');
//beanstalk//
var bs = require('./beanstalk_client.js');
var config = require('./config.js');
var client = bs.Client(config.beanstalkd_uri);
//........//

exports.addJob = function(tube, job, callback)
{ 
  var new_cl = bs.Client(config.beanstalkd_uri);
  job = encodeURIComponent(JSON.stringify(job));
  new_cl.use(tube).onSuccess(function(data) 
  {
    new_cl.put(job).onSuccess(function(data) 
    {
      callback(data);
      new_cl.disconnect();
     });
  });
}

exports.deleteJob = function(job_id, callback)
{ 
  client.deleteJob(job_id).onSuccess(function(del_msg)
  {
    util.log({status:'deleting job', job_id:del_msg});
    callback();
  });
}

function resJob(processingCallback)
{
  	client.reserve().onSuccess(function(job) 
  	{ 
      processingCallback(job, function()
      {
        client.deleteJob(job.id).onSuccess(function(del_msg) 
    		{ 
    		  //synchronous//
    		  resJob(processingCallback);
    		});  
      });
      
  	});
}

exports.listenForJobs = function(tube, callback)
{
  client.watch(tube).onSuccess(function(x)
  {
    resJob(callback);
  });
}
