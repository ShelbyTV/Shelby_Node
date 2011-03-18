var client = require('beanstalk_client').Client;

exports.spawnClientToRes = function(doJob)
{
console.log('spawning client');

client.connect('184.106.78.48:11300', function(err, conn) {
  conn.watch('ws_deliver_to_client', function() {
     conn.reserve(function(err, job_id, job_json) {
      console.log('got job: ' + job_id);

        doJob(JSON.parse(job_json), function()
        {
          conn.destroy(job_id, function(err) {
          console.log('destroyed job');
          exports.spawnClientToRes(doJob);
          conn=null;
          });
        });
      });

     });
    });
}

