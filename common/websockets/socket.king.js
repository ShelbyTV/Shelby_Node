var config = require('../config.js');
var sys  = require('sys');
var io   = require('socket.io');
var http = require('http');
var Clients = {};
var util = require('../util.js');
var job_king = require('../beanstalk/job.king.js');

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
  //var job_data = eval('(' + job.data + ')');
  //var job_data = JSON.parse(job.data); 
 
  if (job.payload && job.user_id)
  {  
    pushPayloadToClient(job.payload, job.user_id, function()
    {
	deleteJobAndListen();
    });
  }
  else
  {
      util.log({"status":"bad/null job data"});
      util.log(job);
      deleteJobAndListen();
  }
}

job_king.spawnClientToRes(config.websocket.tube, proccessNewJob);