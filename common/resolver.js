var spawn = require('child_process').spawn;
var http = require('http');
var util = require('./util.js');

function getHeader(url, callback)
{
  var client = spawn('curl', ['-I', url]);
  client.stdout.on('data', function(data)
  {
    client.kill();
    callback(data.toString('utf8'));
  });
}

function getResponseCode(header, callback)
{ 
  callback(header.split(' ')[1]/1, header);
} 

exports.resolveURL = function(url, callback)
{
  getHeader(url, function(header)
  {
    getResponseCode(header, function(code, header)
    {
      if (code>299 && code<400)
      {
        header = header.split("\r\n");
        var redirect = false;
        for (var i in header)
        {
          redirect = (header[i].indexOf('Location:') != -1) ? header[i].split(' ')[1] : '';
        }
        
        if (!redirect) return;
        
        exports.resolveURL(redirect);
      }
      else if(code==200)
      {
        callback(url);
      }
      else
      {
        util.log({"status":'bad link discarded', "url":url, "response":code})
      }
    });
  });
}