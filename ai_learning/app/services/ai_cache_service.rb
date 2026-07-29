# frozen_string_literal: true

# Read-through cache for AI responses, and the single owner of the key layout
# and TTLs used for them.
#
# Both entry points take an optional `log_usage:` (the same
# `{ feature:, user_id: }` hash passed to ClaudeService) and record a
# `cached: true` usage row on a hit. Without it the admin cost dashboard's
# "Cache hits" column can only ever read 0, because a hit returns before any
# ClaudeService call is made.
class AiCacheService
  TTL          = 30.days.to_i # seconds — default for prompt-keyed entries
  EXERCISE_TTL = 7.days.to_i  # grammar exercises: refreshed weekly

  class << self
    # Fetch a cached AI response, or compute and cache it.
    #
    # Example:
    #   AiCacheService.fetch(prompt, log_usage: { feature: "x", user_id: 1 }) do
    #     ClaudeService.complete(prompt: prompt)
    #   end
    def fetch(prompt, log_usage: nil, &block)
      key    = cache_key(prompt)
      cached = redis.get(key)
      if cached
        log_cache_hit(log_usage)
        return cached
      end

      result = block.call
      redis.setex(key, TTL, result) if result.present?
      result
    end

    # Fetch a cached JSON value under an explicit key, or compute, cache and
    # return it. The block must return a JSON-serialisable object; a corrupt or
    # unparseable cache entry is treated as a miss and recomputed.
    def fetch_json(key, ttl: TTL, log_usage: nil)
      cached = redis.get(key)
      if cached
        begin
          parsed = JSON.parse(cached)
          log_cache_hit(log_usage)
          return parsed
        rescue JSON::ParserError
          # Corrupt entry — fall through and recompute.
        end
      end

      result = yield
      # `unless nil?` rather than `if result`: a legitimately `false` result
      # would otherwise never be cached, and be re-billed on every request.
      redis.setex(key, ttl, result.to_json) unless result.nil?
      result
    end

    # Streaming variant of `fetch`, for SSE endpoints: yields the whole cached
    # text in one go on a hit, otherwise yields each delta as it arrives and
    # caches the assembled reply. Keeps the cache key, the TTL and the Redis
    # handle inside this class instead of the controller.
    def stream(prompt, log_usage:, model: ClaudeService::DEFAULT_MODEL, &emit)
      key    = cache_key(prompt)
      cached = redis.get(key)
      if cached
        log_cache_hit(log_usage)
        emit.call(cached)
        return
      end

      buffer = +""
      ClaudeService.chat(
        messages:  [ { role: "user", content: prompt } ],
        model:     model,
        log_usage: log_usage
      ) do |delta|
        buffer << delta
        emit.call(delta)
      end

      # An empty reply is a failed generation, not an answer worth serving for
      # the next 30 days.
      redis.setex(key, TTL, buffer) if buffer.present?
    end

    # Readable namespaced key, for short bounded parts.
    #   namespaced_key("grammar_exercise", 12, "n5") # => "grammar_exercise:12:n5"
    def namespaced_key(namespace, *parts)
      [ namespace, *parts ].join(":")
    end

    # Namespaced key for unbounded parts (prompts, user-typed sentences), which
    # have to be hashed to keep the key size fixed.
    def hashed_key(namespace, *parts)
      "#{namespace}:#{Digest::SHA256.hexdigest(parts.join(':'))}"
    end

    def cache_key(prompt)
      hashed_key("ai_cache", prompt)
    end

    # A hit still costs a request, just no tokens — recording it is what makes
    # the cache's effect visible on the cost dashboard.
    def log_cache_hit(log_usage)
      return unless log_usage.is_a?(Hash) && log_usage[:feature]

      AiUsageLog.record_async(
        feature:       log_usage[:feature].to_s,
        model:         log_usage[:model] || ClaudeService::DEFAULT_MODEL,
        input_tokens:  0,
        output_tokens: 0,
        user_id:       log_usage[:user_id],
        cached:        true
      )
    end

    private

    def redis
      AppRedis.current
    end
  end
end
