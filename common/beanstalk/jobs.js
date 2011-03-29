var config = require('../config.js'),
async = require('async'),  
util = require('../util.js'),
beanstalk = require('beanstalk_client').Client,
RP = require('../respool.js');


function JobManager(res_tube, put_tube, do_job){
 
  var self = this;
  self.resTube = res_tube;
  self.putTube = put_tube;
  self.doJob = do_job;
  self.respool = RP.createPool();
  
  this.poolect = function(num_clients, callback){
    for (var i=0; i<num_clients; i+=1){
      beanstalk.connect(config.beanstalk.uri+':11300', function(err, conn){
          self.respool.addResource(conn, function(err, res){
            if (self.respool.pool.length===num_clients){
              return callback(null, 'OK');
            }    
          });
        });  
      } 
    };
    
  this.reserve = function(callback){
    self.respool.getResource(function(err, cl){
      cl.watch(self.resTube, function(err, res){
        cl.reserve(function(err, job_id, job_json){
          self.reserve(callback);
          self.doJob(JSON.parse(job_json), function(){
            cl.destroy(job_id, function(err ,res){
              self.respool.freeResource(cl, function(err, res){
                return callback(null, 'OK');
              });
            });
          });
        });
      });
    });
  };
  
  this.put = function(job, callback){
    self.respool.getResource(function(err, cl){
      cl.use(self.putTube, function(err, res){
        cl.put(0, 0, 1, encodeURIComponent(JSON.stringify(job)), function(err, job_id){
          self.respool.freeResource(cl, function(err, res){
            return callback(null, 'OK');
          });
        });
      });
    });
  };    
}

var j = new JobManager(config.websocket.tube, 'bar', function(job, job_done){
  console.log(job);
  job_done();
});

j.poolect(3, function(err, res){
  j.reserve(console.log);
});


/*
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
*/