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

      # POST /api/v1/grammar_points/:id/generate_set
      # Returns: { exercises: [...], grammar_point_id }
      # Generates a set of 10 exercises (5 fill_blank + 3 choice + 2 translate)
      def generate_set
        point = GrammarPoint.find(params[:id])
        level = current_user.jlpt_level

        prompt = Prompts::GrammarSetPrompt.build(
          pattern:        point.pattern,
          explanation_vi: point.explanation_vi,
          user_level:     level
        )

        raw  = ClaudeService.complete(
          prompt:     prompt,
          max_tokens: 3000,
          log_usage:  { feature: "grammar_set", user_id: current_user.id }
        )
        data = parse_ai_json(raw)

        render json: { exercises: Array(data), grammar_point_id: point.id }
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      rescue ClaudeService::RateLimitError
        render json: { error: "rate_limit" }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "timeout" }, status: :request_timeout
      rescue ClaudeService::ServiceError => e
        render json: { error: e.message }, status: :service_unavailable
      end

      # POST /api/v1/grammar_points/:id/complete_set
      # body: { score, total }
      # Returns: { streak_count, next_due_date, score, total }
      def complete_set
        point = GrammarPoint.find(params[:id])
        score = params[:score].to_i
        total = params[:total].to_i
        pct   = total > 0 ? score.to_f / total : 0

        # Map score % → SRS grade (0-3 SM-2 scale)
        grade = case pct
                when 0.9..Float::INFINITY then 3   # easy (≥90%)
                when 0.7...0.9            then 2   # good (≥70%)
                when 0.5...0.7            then 1   # hard (≥50%)
                else 0                             # again (<50%)
                end

        # Replicate flashcards_controller#review pattern
        progress = current_user.user_card_progresses
                               .find_or_initialize_by(card_type: "grammar_point", card_id: point.id)

        if progress.new_record?
          progress.assign_attributes(
            SrsService.initial_state.merge(jlpt_level: point.jlpt_level)
          )
        end

        result = SrsService.calculate_next_review(
          ease_factor: progress.ease_factor.to_f,
          interval:    progress.interval,
          repetitions: progress.repetitions,
          grade:       grade
        )

        progress.assign_attributes(
          interval:         result[:new_interval],
          ease_factor:      result[:new_ease_factor],
          repetitions:      result[:new_repetitions],
          due_date:         result[:due_date],
          last_reviewed_at: Time.current,
          learned:          grade >= 2 ? true : progress.learned
        )
        progress.save!

        StudyLog.record!(user_id: current_user.id, correct: grade >= 2)
        current_user.record_study_session!

        # Update Redis streak
        streak = update_grammar_streak!(current_user.id, point.id)

        render json: {
          streak_count:  streak[:count],
          next_due_date: progress.due_date,
          score:         score,
          total:         total,
          percentage:    (pct * 100).round(1)
        }
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      end

      # GET /api/v1/grammar_points/:id/streak_info
      # Returns: { streak_count, last_practiced }
      def streak_info
        point = GrammarPoint.find(params[:id])
        streak = get_grammar_streak(current_user.id, point.id)
        render json: { streak_count: streak[:count], last_practiced: streak[:last_date] }
      rescue ActiveRecord::RecordNotFound
        render_not_found("GrammarPoint")
      end

      private

      def redis
        @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end

      def grammar_streak_key(user_id, point_id)
        "grammar_streak:#{user_id}:#{point_id}"
      end

      def get_grammar_streak(user_id, point_id)
        raw = redis.get(grammar_streak_key(user_id, point_id))
        return { count: 0, last_date: nil } unless raw
        JSON.parse(raw, symbolize_names: true)
      end

      def update_grammar_streak!(user_id, point_id)
        streak = get_grammar_streak(user_id, point_id)
        today  = Date.current.to_s
        new_count = if streak[:last_date] == today
                      streak[:count]             # already practiced today
                    elsif streak[:last_date] == (Date.current - 1).to_s
                      streak[:count] + 1        # consecutive day
                    else
                      1                          # streak reset
                    end
        new_streak = { count: new_count, last_date: today }
        redis.setex(grammar_streak_key(user_id, point_id), 48 * 3600, new_streak.to_json)
        new_streak
      end
    end
  end
end
