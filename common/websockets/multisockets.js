var config = require('../config.js'),
sys  = require('sys'),
io   = require('socket.io'),
http = require('http'),
Clients = {},
util = require('../util.js'),
JobManager = require('../beanstalk/jobs.js');

function logAllClients(){ 
  var ids = {};
  for (var i in Clients){
    if (Clients.hasOwnProperty(i)){
      ids[i] = Object.keys(Clients[i]).length;
    }
  }  
  util.log('ALL CLIENTS:');
  util.log(ids);
  ids = null;
}

function WSManager(){
  
  var self = this;
  
  this.removeClient = function(client, callback){
    if (!client.hasOwnProperty('user_id')){
      return;
    }
    var user_id = client.user_id;
    if (!Clients.hasOwnProperty(user_id)){
      return;
    }
    delete Clients[user_id][client.sessionId];
    if (Clients.hasOwnProperty(user_id) && !Object.keys(Clients[user_id]).length){
      delete Clients[user_id];
    }
    logAllClients();
    return callback();
  };

  this.addNewClient = function(client, user_id, callback){
    client.user_id = user_id;
    if (!Clients.hasOwnProperty(user_id)){
      Clients[user_id] = {};
    }
    Clients[user_id][client.sessionId] = client;
    util.log({"status":'adding client', "user_id":client.user_id});
    return callback();
  };

  this.pushPayloadToClient = function(payload, user_id, callback){
    if (!Clients.hasOwnProperty(user_id)){
      util.log({"status":"user "+user_id+" not currently connected"});
    } else { 
      util.log({"status":"sending payload to user", "client":user_id});
      for (var i in Clients[user_id]){
        if (Clients[user_id].hasOwnProperty(i)){
        Clients[user_id][i].send(payload);        
        }
      }
    } 
    return callback();
  };

  this.proccessNewJob = function(job, deleteJobAndListen){ 
    if (job.payload && job.user_id){  
      return self.pushPayloadToClient(job.payload, job.user_id, deleteJobAndListen);
    } else {
        util.log({"src":"WSManager", "status":"bad/null job data"});
        return deleteJobAndListen();
    }
  };
  
  this.init = function(){
    
    var server = http.createServer(function(req, res) { 
      res.writeHead(200, {'Content-Type': 'text/html'}); 
      res.end(); 
    });

    server.listen(config.websocket.server_port, config.websocket.server_uri);
    
    console.log('socket webserver listening on '+config.websocket.server_uri+':'+config.websocket.server_port);

    var socket = io.listen(server); 

    socket.on('connection', function(client){ 
      client.on('message', function(message){ 
        console.log(message);
        if (message.action=='init'){
          self.addNewClient(client, message.user_id, function(){
            return logAllClients();
          });
        }
      });  

      client.on('disconnect', function(){  
        self.removeClient(client, function(err, res){
          client = null;
        });
      });
    });
   
    var j = JobManager.create(config.websocket.tube, null, self.proccessNewJob);

    j.poolect(20, function(err, res){
      j.reserve(function(err, res){
        return;
      });
    });
      
  }; 
} 

var ws = new WSManager();
ws.init();

