var express = require('express'),
    connect = require('connect'),
    facebookClient = require('facebook-js')(
      '115071338568035',
      '416ce973e4a78ca6a99227731946b27b'
    ),
    app = express.createServer(
      connect.bodyParser(),
      connect.cookieParser(),
      connect.session({"secret":"shelby"})
    ),
    redis = require('redis').createClient();

app.set('views', __dirname);

app.get('/', function (req, res) {
  res.redirect(facebookClient.getAuthorizeUrl({
    client_id: '115071338568035',
    redirect_uri: 'http://nodea.shelby.tv/auth',
    scope: 'offline_access,publish_stream,read_stream'
  }));
});

app.get('/auth', function (req, res) {
  facebookClient.getAccessToken({redirect_uri: 'http://nodea.shelby.tv/auth', code: req.param('code')}, function (error, token) {
 //TODO INSERT TO REDIS...   
  res.render('views/feed_client.jade', {
      layout: false,
      locals: {
        token: token
      }
    });
  });
});

app.post('/message', function (req, res) {
  facebookClient.apiCall(
    'POST',
    '/me/feed',
    {access_token: req.param('access_token'), message: req.param('message')},
    function (error, result) {
      console.log(error);
      console.log(result);
      res.render('views/done.jade', {layout: false});
    }
  );
});

app.post('/feed', function (req, res) {
  facebookClient.apiCall(
    'GET',
    '/me/home',
    {access_token: req.param('access_token'), fields: 'type,source'},
    function (error, result) {
      console.log(error);
      parseFeed(result);
      res.render('views/feed_done.jade', {layout: false});
    }
  );
});

//app.listen(80);


getFeed('1319152');

function getFeed(user_id)
{ console.log('get feed called');
  getAccessToken(user_id, function(err, token)
  { console.log('got access token::'+token);
    if (err && !token) {callback('ERR:not found', null);return;}
    facebookClient.apiCall(
    'GET',
    '/me/home',
    {access_token: token, fields: 'type,source'},
    function (error, result) {
      if (err) {console.log(error);return;}
      parseFeed(result);
    }
  );
  });
}

function getAccessToken(user_id, callback)
{
  //redis.hget('fb_tokens', user_id, callback);
  callback(null, '115071338568035|cf4da0397104a7a50b4cda8b-1319152|hymtzZncfOtETKwLh84fnI7y4ZE');
}


function parseFeed(feed)
{
  if (feed && feed.data && feed.data.length)
  {
    for (var i in feed.data)
    {
      if (feed.data[i] && feed.data[i].type && feed.data[i].type=='video' && feed.data[i].source)
      {
	linkProccess(feed.data[i]);
      }	
    }	
  }

}

function linkProccess(feed_obj)
{
  console.log(feed_obj);
}
