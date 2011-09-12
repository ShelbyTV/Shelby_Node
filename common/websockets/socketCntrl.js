var Sockets = require('./_sockets.js');
var webSocketServer = new Sockets();
webSocketServer.init();
setInterval(function(){process.exit},120000);
