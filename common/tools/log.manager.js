var spawn = require('child_process').spawn;

function truncateLogs()
{
  var trunc = spawn('truncate', ['--size', '0', 
  '/var/log/shelby/backfill.log', 
  '/var/log/shelby/websocket.log', 
  '/var/log/shelby/stream.log',
  '/var/log/shelby/facebook.log',
  '/var/log/shelby/redis_eval.log',
  '/var/log/shelby/redis.log']);

  trunc = null;  
  
  console.log('files trunced');
}
truncateLogs();
setInterval(truncateLogs, (600000));
