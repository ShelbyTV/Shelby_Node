var config = require('../../common/config.js');
var jobber = require('../../common/beanstalk/jobber.js');

var job = {
  "fb_id":1319152, 
  "fb_access_token":'115071338568035|cf4da0397104a7a50b4cda8b-1319152|hymtzZncfOtETKwLh84fnI7y4ZE'
  };

jobber.init(10, null, config.facebook.tube_add, function()
{
  jobber.putJobJSON(job, function()
  {
    console.log('PUT JOB:', job);
  });
});
 
