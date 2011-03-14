var SocketManager = 
{		
  socket:null,

	attachClient:function(user_id)
	{   
      this.socket = new io.Socket(ClientConfig.websocket.server_uri, {port: ClientConfig.websocket.server_port, rememberTransport: false});
      console.log(this.socket);
      this.socket.on('connect', function() 
			{
			  SocketManager.socket.on('message', function(data) 
  			{
  				SocketManager.executeMessage(data);
  			});
  			
				SocketManager.sendMessage({"action":"init", "user_id":user_id});
				console.log('connected');
			});
			
			this.socket.on('disconnect', function()
			{
			  console.log('DISCONNECTED');
			  //reconnect
			});			
			
			this.socket.connect();
	},
	
	sendMessage:function(message)
	{
	  //jQuery.extend(message, User.requestParams);
	  this.socket.send(message)
	},
	
	executeMessage:function(message)
	{	
		message = jQuery.parseJSON(message);
		
		console.log(message);
		
		switch(message.code)
		{
			case 'new_video':
			//vids.push(message.url)
			break;
		}	
	}
}