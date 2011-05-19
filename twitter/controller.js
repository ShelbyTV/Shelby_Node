var str_lib = require('./lib/str.js');
var Stream = str_lib.create('DESC');
Stream.initialize();
Stream.bind('disonnect', process.exit);
setInterval(process.exit, 1800000);
