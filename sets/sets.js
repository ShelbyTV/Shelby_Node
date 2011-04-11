var dao = require('./dao.js').new();
var JobManager = require('../common/beanstalk/jobs.js');
var config = require('../common/config.js');
var util = require('../common/util.js');

function Sets(){
  
  var self = this;
  
  this.makeMetas = function(job, callback){
    
    //owner: a video, members: users who liked it
    var inverse = {
      "owner":{
        "name":job.params.collection.name,
        "val":job.params.collection.val
      },
      "collection":{
        "name":job.params.owner.name,
        "val":job.params.owner.val
      }
    };
    
    //ie set of all users that have liked vids
    var meta_object_a = {
      "owner":{
        "name":job.params.owner.name,
        "val":"all"
      },
      "collection":{
        "name":job.params.collection.name,
        "val":job.params.collection.val
      }
    };
    
    //ie set of all vids that have been liked
    var meta_object_b = {
      "owner":{
        "name":job.params.collection.name,
        "val":"all"
      },
      "collection":{
        "name":job.params.owner.name,
        "val":job.params.owner.val
      }
    };
    
    return callback(null, [inverse, meta_object_a, meta_object_b]);
  };
  
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
        self.makeMetas(job, function(err ,metas){
          metas.push(job.params);
          dao.addMembers(metas);
        });
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

