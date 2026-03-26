# frozen_string_literal: true

module Api
  module V1
    class VocabularyController < BaseController
      include Api::V1::Concerns::SseStreamable

      # GET /api/v1/vocabularies?level=n5&page=1&per_page=30&search=たべる
      def index
        level  = params[:level].presence&.downcase
        search = params[:search].presence
        page   = [(params[:page].presence || 1).to_i, 1].max
        per    = [[(params[:per_page].presence || 30).to_i, 1].max, 100].min

        scope = Vocabulary.all
        scope = scope.by_level(level) if level
        if search
          like = "%#{search}%"
          scope = scope.where("word LIKE ? OR reading LIKE ? OR meaning_vi LIKE ?", like, like, like)
        end

        total  = scope.count
        vocabs = scope.order(:word).offset((page - 1) * per).limit(per)

        render json: {
          data: VocabularySerializer.new(vocabs).serializable_hash[:data],
          meta: { total: total, page: page, per_page: per, pages: (total.to_f / per).ceil }
        }
      end

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

      # GET /api/v1/vocabularies/:id/explain
      # Looks up vocabulary by ID and streams an SSE explanation.
      # user_level is taken from current_user — no extra param needed.
      def explain_by_id
        vocabulary = Vocabulary.find(params[:id])
        user_level = current_user.jlpt_level

        prompt = Prompts::VocabExplainerPrompt.build(
          word:       vocabulary.word,
          reading:    vocabulary.reading,
          user_level: user_level
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
      rescue ActiveRecord::RecordNotFound
        render_not_found("Vocabulary")
      end

      private

      def redis
        @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end
    end
  end
end
