var config = require('../../common/config.js');
var jobber = require('../../common/beanstalk/jobber.js');

var job = {
  "tumblr_id": 'henry_1', 
  "oauth_token":"ZmYflNcu4AJz5xyLE2IA5rrdj0M1QwkxQ7CJChAr3xqt2BxvOw",
  "oauth_secret":"Wgvz8WaBkXG08fPbvMPR2QjfMEaiMuvkBL77U8JRQBaSqqlIWg"
  };

jobber.init(10, null, config.tumblr_backfill_tube, function()
{
  jobber.putJobJSON(job, function()
  {
    console.log('PUT JOB:', job);
  });
});
 
