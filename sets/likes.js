var dao = require('./dao.js').getDao();

function Likes(){
  
  this.record = function(params, callback){
    // Validation
    console.log(params);
    if (!params.hasOwnProperty('u') || !params.hasOwnProperty('v')){
      return callback('Bad Params');
    }
    //Insertion
    dao.addMember('user', params.u, 'video', params.v, function(err, res){
      if (res){
        return callback(null, 'OK');
      }
      return callback(err);
    });
  };
     
}

exports.new = function(){
  return new Likes();
}

