var http = require('http');
var util = require('../../common/util.js');

var uid = Math.floor(Math.random()*1000);
var vid = Math.floor(Math.random()*1000);


var options = {
  host: '0.0.0.0',
  port: 7531,
  path: '/like?h='+uid+'&m='+vid
};

http.get(options, function(res) {
  
  res.setEncoding('utf8');
  res.on('data', function(chunk){
    console.log(chunk);
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});