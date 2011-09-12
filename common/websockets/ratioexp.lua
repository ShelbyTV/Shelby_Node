return redis.call('expire', KEYS[1], math.ceil(redis.call('ttl', KEYS[1])*ARGV[1]))
