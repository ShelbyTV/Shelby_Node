var config = require('./config.js');
var sys  = require('sys');
var io   = require('socket.io');
var http = require('http');
var job_manager = require('./job.manager.js');
var Clients = {};
var util = require('./util.js');

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
  
  if (!Clients[user_id])
  {
    Clients[user_id] = [];
  }
  
  Clients[user_id].push(client);
  callback();
}

function pushPayloadToClient(payload, user_id, callback)
{
 if (!Clients[user_id])
 {
   util.log({"status":"user "+user_id+" not currently connected"});
   callback();
   return;
 } 
 
 var completed = 0;
 
 for (var i in Clients[user_id])
 {
   util.log({"status":"sending payload to user", "client":user_id})
   Clients[user_id][i].send(payload);
   completed+=1;
   if (completed===Clients[user_id].length)
   {
     callback();
   }    
 }
 
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

function proccessNewJob(job)
{
  if (!job){util.log({status:"null job received"});return;}
  
  var job_data = eval('(' + job.data + ')');
  pushPayloadToClient(job_data.payload, job_data.user_id, function()
  {
    job_manager.deleteJob(job.id, function()
    {
      listen();
    });
  });

}

function listen()
{
  job_manager.listenForJobs(config.websocket.tube, proccessNewJob);
}

listen();

