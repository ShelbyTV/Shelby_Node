var net = require('net');

function getStats()
{
  client.connect('184.106.78.48:11300', function(err, conn) 
  { 
     conn.stats(function(err, res)
     {
	console.log(res);
     }); 
  });
}

var bs = new net.Socket
bs.setEncoding('utf8');

bs.connect(11300, '184.106.78.48', function(res)
{
  bs.on('data', function(data)
  {
    console.log(data);
  });

  setInterval(function(){bs.write('stats', 'utf8')}, 500);
 
});



