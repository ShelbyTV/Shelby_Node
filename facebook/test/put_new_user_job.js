var config = require('../../common/config.js');
var jobber = require('../../common/beanstalk/jobber.js');

var job = {
  "fb_id":1319152, 
  "fb_access_token":'115071338568035|4cef5543d00830460d11d12f.1-1319152|C3Va939nJ_TH79s6z1lKpLm5leo'
  };

jobber.init(10, null, config.facebook.tube_add, function()
{
  jobber.putJobJSON(job, function()
  {
    console.log('PUT JOB:', job);
  });
});
 
