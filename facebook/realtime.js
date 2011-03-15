var http = require("http")
  , sys = require("sys")
  , URL = require("url")  
  , RTG = require("./lib");

var rtg = RTG.createClient({
    app_id: '193241824048964',
    app_secret: '8a4fe7349d4bf4dd0480551cdd749c47',
    domain: 'www.nodea.shelby.tv',
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
