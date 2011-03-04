var config = require('./config.js');

exports.log = function(data)
{
  config.env=='production' ? '': console.log(data);
}

exports.async = require('async');
