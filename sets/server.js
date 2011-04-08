var http = require('http');
var url = require('url');
var sets = require('./sets.js').new();


http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  var params = url.parse(req.url, true);
  sets.record(params, function(err, result){
    console.log(err, result);
    
    if (err){
      return res.end('FAIL');
    }
    return res.end('OK');  
  });
}).listen(7531, "0.0.0.0");
console.log('Server running at http://0.0.0.0:7531/');