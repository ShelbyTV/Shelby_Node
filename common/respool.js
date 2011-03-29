function Respool(){
  
  var self = this;
  
  this.setUrgency = function(urgency, callback){
   if (!(urgency && urgency/1)){
     return callback('Must supply an integer urgency in ms');
   }
   return callback(null, self.urgency = urgency); 
  }; 
  
  this.addResource = function(resource, callback){
    if (!resource){
      return callback('Must supply some sort of resource');
    }
    if (!self.hasOwnProperty('pool')){
      self.pool = [];
    }
    return callback(null, self.pool.push(resource));
  };
  
  this.fillPool = function(pool, callback){ 
    if (!(Array.isArray(pool) && pool.length)){
      return callback('Pool must be an array of resources');
    } 
    self.pool = pool;
    return callback(null, 'OK');
  };
  
  this.getResource = function(callback){
    if (!self.pool){
      callback('Pool has not been filled', null);
    }
    var r = self.pool.shift();
    if (r){
      return callback(null, r);
    } else {
      setTimeout(function(){
        return self.getResource(callback);
      }, self.hasOwnProperty('urgency') ? self.urgency : 100);
    }
  };
  
  this.freeResource = function(resource, callback){
    if (resource===undefined){
      return callback('Resource is undefined', null);
    }
    return callback(null, self.pool.push(resource));
  };
}  

exports.createPool = function()
{
  return new Respool();
};
