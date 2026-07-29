# frozen_string_literal: true

# Single owner of the Redis connection settings.
#
# Connections are memoised per thread rather than per object: a `Redis` client
# is not thread-safe, and `BaseController` used to build a fresh one for every
# request, opening a new TCP connection per API call.
module AppRedis
  DEFAULT_URL = "redis://localhost:6379/0"

  def self.current
    Thread.current[:app_redis] ||= Redis.new(url: url)
  end

  def self.url
    ENV.fetch("REDIS_URL", DEFAULT_URL)
  end
end
