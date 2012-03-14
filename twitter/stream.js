var str_lib = require('./lib/str.js');
var Stream = str_lib.create('DESC');
Stream.initialize();
var startTime = new Date().getTime();
Stream.bind('disonnect', process.exit);
setInterval(process.exit, 1800000);
setInterval(function(){
  console.log(Stream.jobsBuilt, 'jobs built');
  console.log(Stream.jobsBuiltGt, 'jobs built GT');
  console.log(Stream.userCount, 'users');
  console.log(Stream.full_streams.length+Stream.partial_streams.length, 'streams');
  var nowTime = new Date().getTime();
  console.log('building', Math.round(Stream.jobsBuilt/((nowTime-startTime)/1000)), 'per second');
  console.log('==============');
},3000);
