exports.environment = 'development';

exports.twitter_keys = 
{
  consumer_key: '5DNrVZpdIwhQthCJJXCfnQ',
  consumer_secret: 'Tlb35nblFFTZRidpu36Uo3z9mfcvSVv1MuZZ19SHaU',
  oauth_token: '251386798-4hoHpv0Hs541ZAr4apf7tkvUXRmqOWRU1xUkYbui',
  oauth_secret:"xG8jShVGQIcdF6rNJ21DtH40w08tCXIcK7AJBrFZdM"
}

exports.beanstalkd_uri = 'localhost';

exports.twitter_stream_tube = 'tw_stream';

exports.twitter_backfill_tube = 'tw_backfill';

exports.twitter_link_tube = 'link_processing';

exports.twitter_stream_redis_key = 'tw_stream:users';

exports.twitter_stream_limit = 100;

exports.redis_config =
{
  port: '6379',
  server: '127.0.0.1'
}

exports.bitly_usr = 'onshelby';

exports.bitly_api_key = 'R_41aac83f2cc30229bded13d2864827d6';
