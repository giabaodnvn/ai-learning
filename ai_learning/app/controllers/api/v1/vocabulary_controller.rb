# frozen_string_literal: true

module Api
  module V1
    class VocabularyController < BaseController
      include Api::V1::Concerns::SseStreamable

      # POST /api/v1/vocabulary/explain
      def explain
        word       = params.require(:word)
        reading    = params[:reading].presence || word
        user_level = params[:user_level].presence || current_user.jlpt_level

        prompt = Prompts::VocabExplainerPrompt.build(
          word: word, reading: reading, user_level: user_level
        )

        cache_key = AiCacheService.cache_key(prompt)
        cached    = redis.get(cache_key)

        stream_sse do |stream|
          if cached
            write_sse(stream, delta: cached)
          else
            buffer = +""
            ClaudeService.chat(
              messages: [ { role: "user", content: prompt } ],
              model:    ClaudeService::DEFAULT_MODEL
            ) do |delta|
              buffer << delta
              write_sse(stream, delta: delta)
            end
            redis.setex(cache_key, AiCacheService::TTL, buffer)
          end
          write_sse(stream, delta: "", done: true)
        end
      end

      private

      def redis
        @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end
    end
  end
end
