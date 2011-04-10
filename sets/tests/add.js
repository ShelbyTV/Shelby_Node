var http = require('http');
var util = require('../../common/util.js');
var JobManager = require('../../common/beanstalk/jobs.js');
var config  = require('../../common/config.js');
var Sets = require('../sets.js').new();
var j = JobManager.create(null, config.sets.add_tube, null);
var num_jobs = 100;

j.poolect(20, function(err, res){
  newJob();
});

function newJob(){
  for (var i=0;i<num_jobs;i++){
    var uid = Math.floor(Math.random()*1000);
    var vid = Math.floor(Math.random()*1000);

    var test_job = { 
      "action":"add", 
        "params":{
          "owner":{
            "name":"usr",
            "val":uid
          }, 
          "collection":{
            "name":"liked_vids",
            "val":vid
          }
        }
      };  
    
    j.putJson(test_job, console.log);  
  }  
};
