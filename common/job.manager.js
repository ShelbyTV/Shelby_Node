//util//
var util = require('./util.js');
//beanstalk//
var bs = require('./beanstalk_client.js');
var client = bs.Client();
//........//

exports.addJob = function(tube, job, callback)
{ 
  var new_cl = bs.Client();
  new_cl.use(tube).onSuccess(function(data) 
  { util.log('putting '+job.url+' on beanstalk...');
    new_cl.put(job).onSuccess(function(data) 
    {
      callback(data);
      new_cl.disconnect();
  	});
  });
}

function resJob(processingCallback)
{
  	client.reserve().onSuccess(function(job) 
  	{ 
  	  util.log('received job:');
  		util.log(job);
      processingCallback(job, function()
      {
        client.deleteJob(job.id).onSuccess(function(del_msg) 
    		{ 
    		  util.log(del_msg);
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