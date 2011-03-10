exports.environment = 'development';

exports.twitter_keys = 
{
  consumer_key: '5DNrVZpdIwhQthCJJXCfnQ',
  consumer_secret: 'Tlb35nblFFTZRidpu36Uo3z9mfcvSVv1MuZZ19SHaU',
  access_token_key: '250202787-MvZk6aGMDlNvAZPUtQBjexjcZ0HRxDAVmrraPGGP',
  access_token_secret: 'xG8jShVGQIcdF6rNJ21DtH40w08tCXIcK7AJBrFZdM'
}

exports.beanstalkd_uri = 'localhost';

exports.twitter_stream_tube = 'tw_stream';

exports.twitter_backfill_tube = 'tw_backfill';

exports.twitter_link_tube = 'link_processing';

exports.twitter_stream_redis_key = 'tw_stream:users';

exports.twitter_stream_limit = 5;

exports.redis_config =
{
  port: '6379',
  server: '127.0.0.1',
  stream_key: 'stream_users'
}

exports.bitly_usr = 'onshelby';

exports.bitly_api_key = 'R_41aac83f2cc30229bded13d2864827d6';
