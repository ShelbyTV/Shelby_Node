var http = require("http")
  , sys = require("sys")
  , URL = require("url")  
  , RTG = require("../lib");

var rtg = new RTG({
  app_id: '...',
  app_secret: '...',
  domain: 'www.mycoolapp.com',
  path: '/fb/'
});

http.createServer(function(req, res){
  if ( ! rtg.handleRequest(req, res)) {
    var url = URL.parse(req.url, true);
    
    switch (url.pathname) {
      case "/list/":
        res.writeHead(200);
        rtg.list(function(r, data){
          res.end(sys.inspect(data));
        });
      break;
      case '/subscribe/':
        res.writeHead(200);
        rtg.subscribe("user", ["feed", "likes"], function(r, data){
          res.end(sys.inspect(data));
        });
      break;
      case '/unsubscribe/':
        res.writeHead(200);
        rtg.unsubscribe("user", function(r, data){
          res.end(sys.inspect(data));
        });
      break;
      default:
        res.writeHead(404);
        res.end("404 Not Found");
      break;
    }
  }
}).listen(8080);