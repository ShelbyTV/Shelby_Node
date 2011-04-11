var http = require('http');
var util = require('../../common/util.js');
var JobManager = require('../../common/beanstalk/jobs.js');
var config  = require('../../common/config.js');
var Sets = require('../sets.js').new();
var dao = require('../dao.js').new();

dao.getMetaKeys(function(err, res){
  console.log(res);
});
