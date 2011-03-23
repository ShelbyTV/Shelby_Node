var config = require('../config.js');  
var util = require('../util.js');
var client = require('beanstalk_client').Client;
var conn = null;

function connect(tube, doJob, callback)
{ 
  util.log({"status":"connecting to beanstalk"});
  client.connect(config.beanstalk.uri+':11300', function(err, c) 
  {
    var msg = err ? {"status":err} : {"status":"connected to beanstalk"};
    util.log(msg);
    conn = c;
    callback(tube, doJob);
  });  
}

exports.spawnClientToRes = function(tube, doJob)
{ 
  if (!conn)
  {
    connect(tube, doJob, exports.spawnClientToRes);
    return;
  }   
  
  conn.watch(tube, function() 
  {
    conn.reserve(function(err, job_id, job_json) 
    {
      console.log('got job: ' + job_id);
     
      doJob(JSON.parse(job_json), function()
      {
        conn.destroy(job_id, function(rr) 
        {
          console.log('destroyed job');
          exports.spawnClientToRes(tube, doJob);
          //conn=null...not deleting current connection
        });
      });
    });
  });
}

//TODO...
exports.spawnClientToPut = function(tub, job)
{
  console.log('spawning client');
  client.connect(config.beanstalk.uri+':11300', function(err, conn) 
  {
    conn.use(tube, function() 
    {
      conn.put(0, 0, 1, JSON.stringify(job), function(err, job_id) 
      {
        console.log('added job: ' + job_id);
        conn = null;
      });
    });
  });  
}
