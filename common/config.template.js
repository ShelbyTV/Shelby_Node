exports.environment = 'development';

exports.twitter_keys = 
{
  consumer_key: 'qKdbxWDx1D9ELPjqcZLz0A',
  consumer_secret: 'a7AcAmmShY377cIOCME9nqESotgFGA2VWGAPTmQTVM',
  /*access_token_key: '232439599-8Ji6In1HvmOuXiYh24iCA6kYasGfPMiS96FgPMCV',
  access_token_secret: 'wOSnCeZqXJYQXXOZ4PVtmHAICR9WUvJTbY6e9mKLkQ'*/
}

exports.beanstalk_uri = 'localhost';

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