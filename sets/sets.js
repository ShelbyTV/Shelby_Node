var dao = require('./dao.js').getDao();

function Sets(){
  
  this.record = function(params, callback){
    // Validation
    if (!params.hasOwnProperty('query')) return callback('No query params');
    if (!params.query.hasOwnProperty('h') || !params.query.hasOwnProperty('m')) return callback('Bad Params');
    if (!params.hasOwnProperty('pathname')) return callback('No path specified');
    
    switch(params.pathname){
      case '/like':
      return dao.addMember('user', params.query.h, 'vid_likes', params.query.m, callback);      
      break;
      
      default:
      return callback('Unrecognized path');
      break;
    }
    
    return callback('Error occured');
  };
     
}

exports.new = function(){
  return new Sets();
}

