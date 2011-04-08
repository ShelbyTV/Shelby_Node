var http = require('http');
var util = require('../../common/util.js');

var uid = 332;
var vid = 1102;


var options = {
  host: '0.0.0.0',
  port: 7531,
  path: '/like?u='+uid+'&v='+vid
};

http.get(options, function(res) {
  
  res.setEncoding('utf8');
  res.on('data', function(chunk){
    console.log(chunk);
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});