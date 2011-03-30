var async = require('async'),
assert = require('assert'),
config = require('../../config.js'),
JobManager = require('../jobs.js');

var JobsTest = {
  
  creation:function(callback){
    console.log('1. Put job on queue:', '------------');
    
    var j = JobManager.create(config.websocket.tube, 'bar', function(job, job_done){
      console.log(job);
      job_done();
    });

    j.poolect(3, function(err, res){
      var job = {
        "foo":"bar"
      };
      
      j.put(job, function(err, res){
        assert.ok((!err && res), console.log("PASS"));
        return callback();
      });
    });
  }
   
};

var tests = [];

for (var i in JobsTest) {
  if (JobsTest.hasOwnProperty(i)){
    tests.push(JobsTest[i]);  
  }
}

async.series(tests);
