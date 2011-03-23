
exports.sendMessageToClient = function(message, client)
{
	client.send(exports.buildMessage(message));
}

exports.buildMessage = function(message) 
{	
	message.timestamp = new Date().getTime();
	return JSON.stringify(message);
}
