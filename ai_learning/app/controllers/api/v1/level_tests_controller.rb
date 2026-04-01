# frozen_string_literal: true

module Api
  module V1
    class LevelTestsController < BaseController
      NEXT_LEVEL = LevelTest::LEVEL_UP_MAP

      # GET /api/v1/level_tests?level=n5
      # Returns available tests for the level (most recent 5), plus user's attempt history.
      def index
        level = (params[:level].presence || current_user.jlpt_level).downcase
        unless LevelTest::JLPT_LEVELS.include?(level)
          return render json: { error: "Level không hợp lệ" }, status: :unprocessable_entity
        end

        tests   = LevelTest.for_level(level).limit(5)
        history = LevelTestAttempt
          .for_user(current_user.id)
          .for_level(level)
          .order(created_at: :desc)
          .limit(5)

        render json: {
          level:       level,
          next_level:  NEXT_LEVEL[level],
          tests:       tests.map { |t| test_summary(t) },
          history:     history.map { |a| attempt_summary(a) },
          best_score:  history.maximum(:score),
          passed_before: history.where(passed: true).exists?
        }
      end

      # GET /api/v1/level_tests/:id
      # Returns full test questions (without answers — client never receives answer_index).
      def show
        test = LevelTest.find(params[:id])

        sections_without_answers = test.sections.map do |sec|
          sec.merge("questions" => (sec["questions"] || []).map { |q| q.except("answer_index", "explanation_vi") })
        end

        render json: {
          id:              test.id,
          jlpt_level:      test.jlpt_level,
          title:           test.title,
          total_questions: test.total_questions,
          pass_score:      test.pass_score,
          time_limit_min:  test.time_limit_min,
          sections:        sections_without_answers
        }
      rescue ActiveRecord::RecordNotFound
        render_not_found("LevelTest")
      end

      # POST /api/v1/level_tests/generate
      # body: { level: "n5" }
      # Generates a new test via AI and saves to DB.
      def generate
        level = params.require(:level).to_s.downcase
        unless LevelTest::JLPT_LEVELS.include?(level)
          return render json: { error: "Level không hợp lệ" }, status: :unprocessable_entity
        end

        prompt = Prompts::LevelTestPrompt.build(level: level)
        raw    = ClaudeService.complete(
          prompt:     prompt,
          max_tokens: 4096,
          log_usage:  { feature: "level_test_generate", user_id: current_user.id }
        )

        data = parse_ai_json(raw)

        sections = data["sections"] || []
        total    = sections.sum { |s| (s["questions"] || []).size }
        pass_at  = (total * LevelTest::PASS_PERCENT / 100.0).ceil

        test = LevelTest.create!(
          jlpt_level:      level,
          title:           data["title"] || "JLPT #{level.upcase} Mini Test",
          sections:        sections,
          total_questions: total,
          pass_score:      pass_at,
          time_limit_min:  30,
          ai_generated:    true
        )

        render json: test_summary(test).merge(id: test.id), status: :created

      rescue ClaudeService::RateLimitError
        render json: { error: "rate_limit" }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "timeout" }, status: :request_timeout
      rescue ClaudeService::ServiceError => e
        render json: { error: e.message }, status: :service_unavailable
      rescue JSON::ParserError
        render json: { error: "AI trả về định dạng không hợp lệ. Vui lòng thử lại." }, status: :unprocessable_entity
      end

      # POST /api/v1/level_tests/:id/submit
      # body: { answers: [{ question_id:, section_index:, answer_index: }, ...] }
      def submit
        test    = LevelTest.find(params[:id])
        answers = Array(params[:answers]).map(&:to_unsafe_h)

        result  = test.grade(answers)

        attempt = LevelTestAttempt.create!(
          user_id:         current_user.id,
          level_test_id:   test.id,
          answers:         answers,
          score:           result[:score],
          total_questions: result[:total],
          passed:          result[:passed],
          jlpt_level:      test.jlpt_level,
          level_before:    current_user.jlpt_level,
          completed_at:    Time.current
        )

        level_up_info = nil
        if result[:passed]
          next_level = NEXT_LEVEL[test.jlpt_level]
          # Only level up if user is currently at this level (prevent skipping)
          if next_level && current_user.jlpt_level == test.jlpt_level
            current_user.update!(jlpt_level: next_level)
            attempt.update_column(:level_after, next_level)
            level_up_info = { from: test.jlpt_level, to: next_level }
          end
        end

        # Include answer_index + explanation in result for review
        sections_with_answers = test.sections.map do |sec|
          sec.merge("questions" => (sec["questions"] || []).map do |q|
            answer_given = answers.find { |a| a["section_index"].to_i == test.sections.index(sec) && a["question_id"].to_i == q["id"].to_i }
            q.merge("your_answer_index" => answer_given&.dig("answer_index").to_i)
          end)
        end

        render json: {
          attempt_id:    attempt.id,
          score:         result[:score],
          total:         result[:total],
          passed:        result[:passed],
          pass_score:    test.pass_score,
          per_section:   result[:per_section],
          level_up:      level_up_info,
          sections:      sections_with_answers
        }

      rescue ActiveRecord::RecordNotFound
        render_not_found("LevelTest")
      end

      private

      def test_summary(t)
        {
          id:              t.id,
          jlpt_level:      t.jlpt_level,
          title:           t.title,
          total_questions: t.total_questions,
          pass_score:      t.pass_score,
          time_limit_min:  t.time_limit_min,
          created_at:      t.created_at
        }
      end

      def attempt_summary(a)
        {
          id:          a.id,
          score:       a.score,
          total:       a.total_questions,
          passed:      a.passed,
          accuracy:    a.accuracy,
          level_after: a.level_after,
          taken_at:    a.completed_at || a.created_at
        }
      end
    end
  end
end
