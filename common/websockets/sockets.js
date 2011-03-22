var config = require('../config.js');
var sys  = require('sys');
var io   = require('socket.io');
var http = require('http');
var Clients = {};
var util = require('../util.js');
var jobber = require('../beanstalk/jobber.js');

server = http.createServer(function(req, res) 
{ 
  res.writeHead(200, {'Content-Type': 'text/html'}); 
  res.end(); 
});

server.listen(config.websocket.server_port, config.websocket.server_uri);
console.log('socket webserver listening on '+config.websocket.server_uri+':'+config.websocket.server_port)

var socket = io.listen(server); 

socket.on('connection', function(client){ 
	
	client.on('message', function(message)
	{ 
	  console.log(message);
	  switch(message.action)
	  {
	    case 'init':
	    addNewClient(client, message.user_id, function()
	    {
	     util.log({"status":'adding client', "user_id":message.user_id});
	     logAllClients();
	    });
	    break;
	  }
	});  
	
	client.on('disconnect', function()
	{  
	  removeClient(client, function()
	  {
	    util.log({"status":"removing client", "user_id":client.user_id});
	    logAllClients();
	  });
	});
	
});

function removeClient(client, callback)
{
  delete Clients[client.user_id];
  logAllClients();
  callback();
}

function addNewClient(client, user_id, callback)
{
  client.user_id = user_id;
  Clients[user_id] = client;
  callback();
}

function pushPayloadToClient(payload, user_id, callback)
{
 if (!Clients[user_id])
 {
   util.log({"status":"user "+user_id+" not currently connected"});
 } 
 else
 { 
   
   util.log({"status":"sending payload to user", "client":user_id});
   Clients[user_id].send(payload);    
   
 }
 callback();
  
}

function logAllClients()
{ 
  var ids = [];
  
  for (var i in Clients)
  {
    ids.push(i);
  }
  
  util.log('ALL CLIENTS:');
  util.log(ids);
  delete ids;
}

function proccessNewJob(job, deleteJobAndListen)
{ 
  job = JSON.parse(job.data);
  if (job.payload && job.user_id)
  {  
    pushPayloadToClient(job.payload, job.user_id, deleteJobAndListen);
  }
  else
  {
      util.log({"status":"bad/null job data"});
      deleteJobAndListen();
  }
}

//jobber.init(config.websocket.tube, proccessNewJob, null, job_king.spawnClientToRes);

jobber.init(10, config.websocket.tube, null, function()
{ 
  jobber.resJob(proccessNewJob);
});