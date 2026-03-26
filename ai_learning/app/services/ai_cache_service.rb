# frozen_string_literal: true

class AiCacheService
  TTL = 30.days.to_i # seconds

  # Fetch a cached AI response, or compute and cache it.
  # Pass skip_cache: true for dynamic content (e.g. conversation messages).
  #
  # Example:
  #   AiCacheService.fetch("explain grammar N て form") { ClaudeService.complete(prompt: ...) }
  def self.fetch(prompt, skip_cache: false, &block)
    return block.call if skip_cache

    key    = cache_key(prompt)
    cached = redis.get(key)
    return cached if cached

    result = block.call
    redis.setex(key, TTL, result)
    result
  end

  def self.invalidate(prompt)
    redis.del(cache_key(prompt))
  end

  def self.cache_key(prompt)
    "ai_cache:#{Digest::SHA256.hexdigest(prompt)}"
  end

  class << self
    private

    def redis
      @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
    end
  end
end
