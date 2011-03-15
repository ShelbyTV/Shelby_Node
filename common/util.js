var config = require('./config.js');

exports.log = function(data)
{
  config.env=='production' ? '': console.log(data);
}

exports.async = require('async');

exports.resolveURL = require('./resolver.js').resolveURL;


var Bitly = require('./node-bitly/lib/bitly/Bitly.js').Bitly;
var bitly_client = new Bitly(config.bitly_usr, config.bitly_api_key);

exports.expandURL = function(url, tweet, callback)
{ 
  bitly_client.expand([url], function(expanded_url)
  { 
    if (expanded_url && expanded_url.data && expanded_url.data.expand && expanded_url.data.expand.length)
    {
      expanded_url.data.expand[0].error ?  callback(url, tweet) : callback(expanded_url.data.expand[0].long_url, tweet);
    }
    else
    {
      callback(url, tweet);
    }
  });
}
