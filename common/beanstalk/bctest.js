var beanstalk = require('beanstalk_client').Client;
var config = require('../config.js');
var util = require('util');


beanstalk.connect(config.beanstalk.uri+':11300', function(err , c){
    
});
