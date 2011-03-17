var spawn = require('child_process').spawn;
var http = require('http');
var util = require('./util.js');
var living_children = 0;

function getHeader(url, callback)
{
  
  while(living_children>9)
  {
    //wait
  }
  console.log('SPAWNING...');
  living_children++;
  var client = spawn('curl', ['-I', '-L', url]);
  client.stdout.setEncoding('utf8');
  
  client.on('exit', function(exit_code)
  {
    living_children--;
  });
  
  client.stdout.on('data', function(data)
  {
    client.kill('SIGTERM');
    callback(data);
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
        var pos = header.indexOf('Location:');    
        var location = (pos !=-1) ? header.substring(pos+10, header.indexOf("\r\n", pos)) : false;    
        if (location) 
        {
          exports.resolveURL(location, callback); 
          return;
        }
        util.log({"status":'bad link discarded', "url":url, "response":code});
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
