var dao = require('./dao.js').new();
var JobManager = require('../common/beanstalk/jobs.js');
var config = require('../common/config.js');
var util = require('../common/util.js');

function Sets(){
  
  var self = this;
  
  this.validate = function(job, callback){
    if (!util.hasProperty(job, 'action')){
      return callback('Job needs an action attr');
    }
    if (!util.hasProperty(job, 'params')){
      return callback('Job needs params attr');
    }
    
    switch(job.action){
      case 'add':
        if (!(util.hasProperty(job.params, 'owner') && util.hasProperty(job.params, 'collection'))){
          return callback('Job needs owner and collection attrs');
        }
        for (var i in job.params){
          if (!(util.hasProperty(job.params[i], 'name') && util.hasProperty(job.params[i], 'val'))){
            return callback('Job attr '+job.params[i]+' needs name and val attrs');
          }
        }
      break; 
    }
    
    return callback(null, 'Job validated');
  };
  
  this.record = function(job, deleteJob){  
    deleteJob();
    console.log(job);
    self.validate(job, function(err, res){
      if (err) return util.log({"status":"ERR", "msg":err});
      util.log({"status":"OK", "msg":res});
      
      switch(job.action){
        case 'add':
        dao.addMember(job.params, console.log);
        break;
      }
    });    
  };
  
  this.init = function(callback){
    var j = JobManager.create(config.sets.add_tube, null, self.record);
    j.poolect(20, function(err, res){
      j.reserve(function(err, res){
        return;
      });
    });
  };    
}

exports.new = function(){
  var s = new Sets();
  s.init(function(){
    return s;
  });
};

