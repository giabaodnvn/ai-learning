# frozen_string_literal: true

module Api
  module V1
    class GrammarPointsController < BaseController
      include Api::V1::Concerns::SseStreamable

      EXERCISE_TTL = 7 * 24 * 3600 # 7 days

      # GET /api/v1/grammar_points?level=n5&page=1&per_page=20
      def index
        level   = params[:level].presence&.downcase
        page    = [(params[:page].presence || 1).to_i, 1].max
        per     = [[(params[:per_page].presence || 20).to_i, 1].max, 50].min

        scope  = level ? GrammarPoint.by_level(level) : GrammarPoint.all
        total  = scope.count
        points = scope.order(:id).offset((page - 1) * per).limit(per)

        render json: {
          data: GrammarPointSerializer.new(points).serializable_hash[:data],
          meta: { total: total, page: page, per_page: per, pages: (total.to_f / per).ceil }
        }
      end

      # GET /api/v1/grammar_points/:id
      def show
        point = GrammarPoint.find(params[:id])
        render json: GrammarPointSerializer.new(point).serializable_hash
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      end

      # POST /api/v1/grammar_points/:id/check_sentence
      # body: { sentence: "..." }
      # Returns: { correct, errors, rewritten_sentence, explanation_vi }
      def check_sentence
        point    = GrammarPoint.find(params[:id])
        sentence = params.require(:sentence).to_s.strip
        level    = current_user.jlpt_level

        cache_key = "grammar_check:#{Digest::SHA256.hexdigest(sentence + point.id.to_s)}"
        cached    = redis.get(cache_key)

        result = if cached
          JSON.parse(cached)
        else
          prompt = Prompts::GrammarCheckerPrompt.build(
            sentence:       sentence,
            target_grammar: point.pattern,
            user_level:     level
          )
          raw    = ClaudeService.complete(prompt: prompt)
          parsed = parse_ai_json(raw)
          redis.setex(cache_key, AiCacheService::TTL, parsed.to_json)
          parsed
        end

        render json: result
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      rescue ClaudeService::RateLimitError
        render json: { error: "rate_limit" }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "timeout" }, status: :request_timeout
      rescue ClaudeService::ServiceError => e
        render json: { error: e.message }, status: :service_unavailable
      end

      # POST /api/v1/grammar_points/:id/generate_exercise
      # Returns: { sentence_with_blank, options, answer_index, explanation_vi }
      # Cached 7 days per grammar_point+level
      def generate_exercise
        point = GrammarPoint.find(params[:id])
        level = current_user.jlpt_level

        cache_key = "grammar_exercise:#{point.id}:#{level}"
        cached    = redis.get(cache_key)

        result = if cached
          JSON.parse(cached)
        else
          prompt = Prompts::ExerciseGeneratorPrompt.build(
            pattern:        point.pattern,
            explanation_vi: point.explanation_vi,
            user_level:     level
          )
          raw    = ClaudeService.complete(prompt: prompt)
          parsed = parse_ai_json(raw)
          redis.setex(cache_key, EXERCISE_TTL, parsed.to_json)
          parsed
        end

        render json: result
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      rescue ClaudeService::RateLimitError
        render json: { error: "rate_limit" }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "timeout" }, status: :request_timeout
      rescue ClaudeService::ServiceError => e
        render json: { error: e.message }, status: :service_unavailable
      end

      # POST /api/v1/grammar_points/:id/ask  (SSE streaming)
      # body: { messages: [{role, content}, ...] }
      def ask
        point    = GrammarPoint.find(params[:id])
        messages = Array(params[:messages]).map do |m|
          { role: m[:role].to_s, content: m[:content].to_s }
        end
        level = current_user.jlpt_level

        system_prompt = Prompts::GrammarTutorPrompt.build(
          pattern:        point.pattern,
          explanation_vi: point.explanation_vi,
          user_level:     level
        )

        stream_sse do |stream|
          ClaudeService.chat(
            messages: messages,
            system:   system_prompt,
            model:    ClaudeService::CONVERSATION_MODEL
          ) do |delta|
            write_sse(stream, delta: delta)
          end
          write_sse(stream, delta: "", done: true)
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      end

      private

      def redis
        @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end
    end
  end
end
