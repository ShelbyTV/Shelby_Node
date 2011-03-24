var config = require('../config.js'),  
util = require('../util.js'),
bs = require('./nodestalker/lib/beanstalk_client'),
pool = [],
resTube,
putTube;

exports.init = function(size, res_tube, put_tube, callback)
{ 
  util.log({"status":"initializing "+size+" clients to beanstalk"});
  
  resTube = res_tube;
  putTube = put_tube;
  
  for (var i=0; i<size; i++)
  {
    pool.push(bs.Client(config.beanstalkd_uri));  
  }
  
  callback();    
}

function getFreeClient(callback)
{
  var cl = pool.shift();
 
  if (cl)
  {
    callback(cl);
  } 
  else
  {
    setTimeout(function()
    {
      getFreeClient(callback);
    }, 100);
  }
}

function makeClientFree(cl)
{
  pool.push(cl);
}

exports.resJob = function(processJob) 
{
  getFreeClient(function(client)
  {
    client.watch(resTube).onSuccess(function(data) 
    {
      client.reserve().onSuccess(function(job) 
      {
        //console.log('RECEIVED JOB:', job);
        util.log({"status":"received job"});
        console.log(job);
        exports.resJob(processJob);
        processJob(job, function() 
        {
          //console.log('PROCESSED:', job);
          util.log({"status":"processed job"});
          client.deleteJob(job.id).onSuccess(function(del_msg) 
          {   
              util.log({"status":"deleted job"});
              //console.log('DELETED:', job);
              //console.log(del_msg);
              makeClientFree(client);
          });
        });
      });
    });
  });
}

exports.putJob = function(job, callback)
{ 
  getFreeClient(function(cl)
  {
    job = encodeURIComponent(JSON.stringify(job));
    cl.use(putTube).onSuccess(function(data) 
    {
      cl.put(job).onSuccess(function(data) 
      { 
        util.log({"status":"added job", "job_id:":data});
        callback(data);
        makeClientFree(cl);
      });
    });
  });
}

exports.putJobJSON = function(job, callback)
{ 
  getFreeClient(function(cl)
  {
    job = JSON.stringify(job);
    cl.use(putTube).onSuccess(function(data) 
    {
      cl.put(job).onSuccess(function(data) 
      { 
        util.log({"status":"added job", "job_id:":data});
        callback(data);
        makeClientFree(cl);
      });
    });
  });
}
