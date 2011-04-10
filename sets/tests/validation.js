var http = require('http');
var util = require('../../common/util.js');
var JobManager = require('../../common/beanstalk/jobs.js');
var config  = require('../../common/config.js');
var Sets = require('../sets.js').new();
var j = JobManager.create(null, config.sets.add_tube, null);

var uid = Math.floor(Math.random()*1000);
var vid = Math.floor(Math.random()*1000);

var test_jobs = [

  { "action":"add", 
    "params":
    {
      "owner":{
        "name":"usr",
        "val":uid
      }, 
      "collection":{
        "name":"liked_vids",
        "val":vid
      }
    }
  },
  
  {"collection":{
      "name":"liked_vids",
      "val":vid
    }
  }
];

var test_job_id = 0;

j.poolect(20, function(err, res){
  newJob(0);
});

function newJob(job_id){
  if (!test_jobs.hasOwnProperty(job_id)){
    return;
  }
  
  j.putJson(test_jobs[job_id], function(err, res){
    newJob(++job_id);
  }); 
};
