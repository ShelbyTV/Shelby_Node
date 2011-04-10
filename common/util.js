var config = require('./config.js');
var util = require('util');

exports.log = function(data)
{
  config.env=='production' ? '': util.log(util.inspect(data, false, null));
}

exports.async = require('async');

exports.hasProperty = function(obj, prop){
  return (obj.hasOwnProperty(prop) && obj[prop]);
};


//exports.resolveURL = require('./resolver.js').resolveURL;

/*
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
*/

/*
* type: string : 'ms' for return in milliseconds 's' for return in seconds
*/
exports.getTimestamp = function(type, callback)
{
  var ms = new Date().getTime();
  
  switch(type)
  {
    case 'ms':
    break;
    
    case 's':
    ms = Math.round(ms/1000);
    break;
  }
  
  callback(ms);
}
