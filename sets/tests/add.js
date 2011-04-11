var http = require('http');
var util = require('../../common/util.js');
var JobManager = require('../../common/beanstalk/jobs.js');
var config  = require('../../common/config.js');
var Sets = require('../sets.js').new();
var j = JobManager.create(null, config.sets.add_tube, null);
var num_jobs = 1;

j.poolect(20, function(err, res){
  newJob();
});

function newJob(){
  for (var i=0;i<num_jobs;i++){
    var uid = Math.floor(Math.random()*10);
    var vid = Math.floor(Math.random()*20);

    var test_job = { 
      "action":"add", 
        "params":{
          "owner":{
            "name":"usr",
            "val":uid
          }, 
          "collection":{
            "name":"vid",
            "val":vid
          }
        }
      };  
    
    j.putJson(test_job, console.log);  
  }  
};
