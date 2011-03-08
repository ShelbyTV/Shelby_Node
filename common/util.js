var config = require('./config.js');

exports.log = function(data)
{
  config.env=='production' ? '': console.log(data);
}

exports.async = require('async');

exports.resolveURL = require('./resolver.js').resolveURL;


var Bitly = require('./node-bitly/lib/bitly/Bitly.js').Bitly;
var bitly_client = new Bitly(config.bitly_usr, config.bitly_api_key);

exports.expandUrl = function(url, callback)
{ 
  bitly_client.expand([url], function(expanded_url)
  { 
    expanded_url.data.expand[0].error ?  callback(false) : expanded_url.data.expand[0].long_url;
  });
}
