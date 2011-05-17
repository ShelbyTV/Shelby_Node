var cp = require('child_process'),
respool = require('./respool.js'),
async = require('async'),
JobManager = require('./beanstalk/jobs.js'),
config = require('./config.js');

var Resolver = function(num_clients){
  var self = this;
  this.num_clients =  num_clients ? num_clients : 10;
  this.curlpool = respool.createPool();
  this.jobber = JobManager.create(config.resolver.tube_add, config.embedly.tube_add, self.resolveFromJob); 
  this.jobber.poolect(20, function(err, res){
    self.jobber.reserve(function(err,res){
      return self.initPool();
    });
  });
};

/*
* Generates a pool of spawns
*/
Resolver.prototype.initPool = function(){
 var self = this, resources = []; 
 for (var i = 0; i<self.num_clients; i++){
     resources.push(cp.spawn);
 }
 self.curlpool.fillPool(resources, function(err ,res){
   return;
 }); 
};

Resolver.prototype.resolveFromJob = function(job, deleteJob){
  deleteJob();
  var self = this;
  self.resolveUrl(job.url, 0, function(err, res){
    this.jobber.put({"url":res}, function(data){
     return; 
    });
  });
};

Resolver.prototype.resolveUrl = function(url, attempt, callback){
  if (attempt>5) return callback(true);
  var self = this;
  self.getHeader(url, function(err, header){
    var code = self.getResponseCode(header),
    loc = self.getLocation(header);
    if (code===200){
      return callback(null, url);
    }
    if (code>299 && code<400 && loc){
      return self.resolveUrl(loc, attempt+1, callback);
    }
    return callback(true);
  });
},

/*
* @param url {String} 
*/
Resolver.prototype.getHeader = function(url, callback){
  var self = this;
  this.curlpool.getResource(function(err, cl){
    var curl = cl('curl', ['-I', url]), header;
    curl.stdout.setEncoding('utf8');
    curl.stdout.on('data', function(data){
      header = data;
    });
    curl.stdout.on('end', function(){
      self.curlpool.freeResource(cl, function(err,res){
        return header ? callback(null, header) : callback(true);
      });
    });
  });
};

Resolver.prototype.stripEmptyHeaders = function(header){
  var output = [];
  for (var i in header){
    if (header[i]!=='' && header[i].length){
      output.push(header[i]);   
     }
  }
  return output;
}

Resolver.prototype.getResponseCode = function(header){ 
  return header.split(' ')[1]/1;
};

/*
*
*/
Resolver.prototype.getLocation = function(header){
  var parse_loc = /Location:\s(.*)\r\n/;
  var res = parse_loc.exec(header);
  return res && res[1] ? res[1] : false;
};

Resolver.prototype._getFinalResponse = function(header_array){
 console.log(header_array.length);
 for (var i = header_array.length-1; i>-1; i--){
   console.log(i);
  if (header_array[i] && header_array[i].length){
    console.log('ENTERED ON '+i);
    return this._getResponseCode(header_array[i]);
  } 
 } 
};


var resolver =  new Resolver(50); 


