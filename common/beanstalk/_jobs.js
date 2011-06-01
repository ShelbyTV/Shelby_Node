var config = require('../config.js'),
async = require('async'),  
util = require('../util.js'),
beanstalk = require('./node-beanstalk-client/lib/_beanstalk.js').Client,
RP = require('../respool.js');

beanstalk.bind('stream_end', process.exit);

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
          util.log({"src":"JobManager", "status":"got job", "id":job_id});
          self.reserve(callback);
          self.doJob(JSON.parse(job_json), function(){
            cl.destroy(job_id, function(err ,res){
              util.log({"src":"JobManager", "status":"deleted job", "id":job_id});
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
        cl.put(0, 0, 10000, encodeURIComponent(JSON.stringify(job)), function(err, job_id){
          util.log({"src":"JobManager","status":"added job", "id":job_id});
          self.respool.freeResource(cl, function(err, res){
            return callback(null, 'OK');
          });
        });
      });
    });
  };
  
  this.putJson = function(job, callback){
    self.respool.getResource(function(err, cl){
      cl.use(self.putTube, function(err, res){
        cl.put(0, 0, 10000, JSON.stringify(job), function(err, job_id){
          util.log({"src":"JobManager","status":"added job", "id":job_id});
          self.respool.freeResource(cl, function(err, res){
            return callback(null, 'OK');
          });
        });
      });
    });
  };    
      
}

exports.create = function(res_tube, put_tube, do_job){
  return new JobManager(res_tube, put_tube, do_job);
};
