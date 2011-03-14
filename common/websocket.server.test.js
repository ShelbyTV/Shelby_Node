var config = require('./config.js');
var sys  = require('sys');
var io   = require('socket.io');
var http = require('http');
var response = require('./clientresponse.js');
var job_manager = require('./job.manager.js');
var Clients = {};
var util = require('./util.js');
var fs = require('fs');


server = http.createServer(function(req, res) 
{ 
  res.writeHead(200, {'Content-Type': 'text/html'}); 
  res.end(); 
});

server.listen(config.websocket.server_port, 5556);
console.log('socket webserver listening on '+config.websocket.server_uri+':5556');

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
	     fs.readFile('payload.txt', 'utf8', function(err, data)
	     {
	       console.log('client added');
   	     console.log(Clients);
   	     setInterval(function(){pushPayloadToClient(data, message.user_id, function(){})}, 5000);
	     });  
	    });
	    break;
	  }
	});  
	
	client.on('disconnect', function()
	{  
	  removeClient(client, function()
	  {
	    //reponse / logging?
	  });
	});
	
});

function removeClient(client, callback)
{
  delete Clients[client.user_id];
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
   util.log({"status":"sending payload to user", "client":user_id, "payload":payload})
   response.sendMessageToClient(payload, Clients[user_id][i]);
   completed+=1;
   if (completed===Clients[user_id].length)
   {
     callback();
   }    
 }
 
}

function proccessNewJob(job)
{
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

