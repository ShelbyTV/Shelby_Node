var flr = require('../../common/linereader.js');
var reader = new flr.FileLineReader('twit_ids', 10);
var config = require('../../common/config.js');
var redis = require('redis').createClient(config.redis_config.port, config.redis_config.server);

while(reader.hasNextLine())
{
  var word = reader.nextLine();

  if (word.length>1 && word!='')
  {
    redis.sadd(config.redis_config.stream_key, word, function(err, res)
    {
      if (!err)
      {
        console.log('added a user');  
      }
      
    });
  }
}