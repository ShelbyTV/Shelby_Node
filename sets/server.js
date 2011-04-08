var http = require('http');
var url = require('url');
var likes = require('./likes.js').new();


http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  var params = url.parse(req.url, true);
  if (!params.hasOwnProperty('query')) return res.end('Bad query');
  likes.record(params.query, function(err, result){
    if (err){
      return res.end(err);
    }
    return res.end(result);  
  });
}).listen(7531, "0.0.0.0");
console.log('Server running at http://0.0.0.0:7531/');