var config = require('../config.js'),
sys  = require('sys'),
express = require('express'),
app = express.createServer(),
io   = require('socket.io'),
http = require('http'),
util = require('../util.js'),
dgram  = require('dgram'),
JobManager = require('../beanstalk/_jobs.js');

var WSManager = module.exports =  function(){
  this.Clients = {};
};
  
WSManager.prototype.removeClient = function(client, callback){
  if (!client.hasOwnProperty('user_id')){
    return;
  }
  var user_id = client.user_id;
  if (!this.Clients.hasOwnProperty(user_id)){
    return;
  }
  delete this.Clients[user_id][client.sessionId];
  if (this.Clients.hasOwnProperty(user_id) && !Object.keys(this.Clients[user_id]).length){
    delete this.Clients[user_id];
  }
  this.logAllClients();
	var message = new Buffer('web_sockets.connected_now:-1|c');
	var socket = dgram.createSocket('udp4');
	socket.send(message, 0, message.length, 8125, "50.56.19.195", function (err, bytes){
		if (err) { throw err; }
		socket.close();
		//console.log("Wrote " + bytes + " bytes to socket.");
	});

  return callback();
};

WSManager.prototype.addNewClient = function(client, user_id, callback){
  client.user_id = user_id;
  if (!this.Clients.hasOwnProperty(user_id)){
    this.Clients[user_id] = {};
  }
  this.Clients[user_id][client.sessionId] = client;
  util.log({"status":'adding client', "user_id":client.user_id});
	var message = new Buffer('web_sockets.connected_now:1|c');
	var socket = dgram.createSocket('udp4');
	socket.send(message, 0, message.length, 8125, "50.56.19.195", function (err, bytes){
		if (err) { throw err; }
		socket.close();
		//console.log("Wrote " + bytes + " bytes to socket.");
	});
  return callback();
};

WSManager.prototype.pushPayloadToClient = function(payload, user_id, callback){
  if (!this.Clients.hasOwnProperty(user_id)){
    util.log({"status":"user "+user_id+" not currently connected"});
  } else { 
    util.log({"status":"sending payload to user", "client":user_id});
    for (var i in this.Clients[user_id]){
      if (this.Clients[user_id].hasOwnProperty(i)){
        this.Clients[user_id][i].json.send('payload', payload);        
      }
    }
  } 
  return callback();
};

WSManager.prototype.proccessNewJob = function(job, deleteJobAndListen){ 
  var self = this;
  if (job.payload && job.user_id){  
    return this.pushPayloadToClient(job.payload, job.user_id, deleteJobAndListen);
  } else {
    util.log({"src":"WSManager", "status":"bad/null job data"});
    return deleteJobAndListen();
  }
};
  
WSManager.prototype.init = function(){
  var self = this;  

  /*var server = http.createServer(function(req, res) { 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end(); 
  });*/

  io = io.listen(app);

  app.listen(config.websocket.server_port, config.websocket.server_uri);

  //server.listen(config.websocket.server_port, config.websocket.server_uri);
  
  console.log('socket webserver listening on '+config.websocket.server_uri+':'+config.websocket.server_port);

  //var socket = io.listen(server); 

  io.sockets.on('connection', function(client){ 
    client.on('message', function(message){ 
      console.log(message);
      if (message.action=='init'){
        self.addNewClient(client, message.user_id, function(){
          return self.logAllClients();
        });
      }
    });  

    client.on('disconnect', function(){  
      self.removeClient(client, function(err, res){
        client = null;
      });
    });
  });
   
    /*this.jobber = JobManager.create(config.websocket.tube, null, function(job, deleteJob){self.proccessNewJob(job, deleteJob);});
    this.jobber.poolect(20, function(err, res){
      self.jobber.reserve(function(err, res){
        return;
      });
    });*/

  }; 

WSManager.prototype.logAllClients = function(){ 
  var ids = {};
  for (var i in this.Clients){
    if (this.Clients.hasOwnProperty(i)){
      ids[i] = Object.keys(this.Clients[i]).length;
    }
  }  
  util.log('ALL CLIENTS:');
  util.log(ids);
  ids = null;
};

//var ws = new WSManager();
//ws.init();
//setInterval(function(){process.exit},1200000);
