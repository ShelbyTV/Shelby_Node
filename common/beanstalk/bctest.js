var beanstalk = require('./node-beanstalk-client/lib/_beanstalk.js').Client;
var config = require('../config.js');
var util = require('util');

beanstalk.bind('stream_end', function(){
  console.log('ended');
});

beanstalk.connect(config.beanstalk.uri+':11300', function(err , c){
  if (typeof c=='object'){
    console.log('connected');
  }
});

setInterval(function(){
  console.log('.');
},10000);
