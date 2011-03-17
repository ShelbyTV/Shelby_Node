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
  //job_encoded = encodeURIComponent(JSON.stringify(job));
  job = encodeURIComponent(JSON.stringify(job));
  new_cl.use(tube).onSuccess(function(data) 
  {
    new_cl.put(job).onSuccess(function(data) 
    {
      //util.log({status:'link proccess job added', "for_user":job.provider_user_id, url:job.url, job_id:data}); 
      callback(data);
      new_cl.disconnect();
     });
  });
}

exports.deleteJob = function(job_id, callback)
{ 
  client.deleteJob(job_id).onSuccess(function(del_msg)
  {
    util.log({"status":'deleting job', "job_id":job_id});
    callback();
  });
}

function resJob(processingCallback)
{
  	client.reserve().onSuccess(function(job) 
  	{ 
      processingCallback(job
        //, function()
      //{
        //client.deleteJob(job.id).onSuccess(function(del_msg) 
    		//{ 
    		  //resJob(processingCallback);
    		//});  
      //}
      );
      
  	});
}

exports.listenForJobs = function(tube, callback)
{
  client.watch(tube).onSuccess(function(x)
  {
    resJob(callback);
  });
}
