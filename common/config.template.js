exports.environment = 'development';

exports.twitter_keys = 
{
  consumer_key: '5DNrVZpdIwhQthCJJXCfnQ',
  consumer_secret: 'Tlb35nblFFTZRidpu36Uo3z9mfcvSVv1MuZZ19SHaU',
  access_token_key: '250202787-MvZk6aGMDlNvAZPUtQBjexjcZ0HRxDAVmrraPGGP',
  access_token_secret: 'xG8jShVGQIcdF6rNJ21DtH40w08tCXIcK7AJBrFZdM'
}

exports.beanstalkd_uri = 'localhost';

exports.twitter_stream_tube_add = 'tw_stream_add';

exports.twitter_backfill_tube = 'tw_backfill';

exports.twitter_link_tube = 'link_processing';

exports.twitter_stream_limit = 100;

exports.beanstalk = 
{
  uri:'127.0.0.1'
}

exports.redis_config =
{
  port: '6379',
  server: '127.0.0.1',
  stream_key: 'stream_users'
}

exports.bitly_usr = 'onshelby';

exports.bitly_api_key = 'R_41aac83f2cc30229bded13d2864827d6';

exports.websocket =
{
  server_uri: '0.0.0.0',
  server_port: '5555',
  tube: 'ws_deliver_to_client'
}

exports.facebook =
{
  app_id: '115071338568035',
  app_secret: '416ce973e4a78ca6a99227731946b27b',
  tube_add: 'fb_add_user'
}

exports.sets =
{
  redis_port: 6380,
  redis_server: '127.0.0.1'
}