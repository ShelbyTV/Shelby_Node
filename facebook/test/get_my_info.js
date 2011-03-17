var fb_dao = require('../lib/facebook_dao.js');

fb_dao.getUserInfo('1319152', function(err,res)
{
  if (err)
  {
    console.log('ERR:'+err);
  }
  else
  {
    console.log(res);
  }
});