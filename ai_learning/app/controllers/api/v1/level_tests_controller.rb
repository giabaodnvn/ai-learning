# frozen_string_literal: true

module Api
  module V1
    class LevelTestsController < BaseController
      self.not_found_label = "LevelTest"

      # GET /api/v1/level_tests?level=n5
      # Returns available tests for the level (most recent 5), plus user's attempt history.
      def index
        level = level_param_or_user
        return render_invalid_param("Level") unless valid_level?(level)

        tests = LevelTest.for_level(level).limit(5)

        # `best_score` / `passed_before` are all-time for this level, so they are
        # read from the unlimited relation. Aggregating over `recent` instead
        # would silently depend on LIMIT being ignored by the aggregate query.
        attempts = LevelTestAttempt.for_user(current_user.id).for_level(level)
        recent   = attempts.order(created_at: :desc).limit(5)

        render json: {
          level:         level,
          next_level:    LevelTest::LEVEL_UP_MAP[level],
          tests:         tests.map { |t| test_summary(t) },
          history:       recent.map { |a| attempt_summary(a) },
          best_score:    attempts.maximum(:score),
          passed_before: attempts.passed.exists?
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
      end

      # POST /api/v1/level_tests/generate
      # body: { level: "n5" }
      # Generates a new test via AI and saves to DB.
      def generate
        level = params.require(:level).to_s.downcase
        return render_invalid_param("Level") unless valid_level?(level)

        data = AiJson.complete(
          prompt:     Prompts::LevelTestPrompt.build(level: level),
          feature:    "level_test_generate",
          user_id:    current_user.id,
          max_tokens: 4096
        )

        sections = data["sections"] || []
        total    = sections.sum { |s| (s["questions"] || []).size }
        pass_at  = (total * LevelTest::PASS_PERCENT / 100.0).ceil

        test = create_from_ai!("test data") do
          LevelTest.create!(
            jlpt_level:      level,
            title:           data["title"] || "JLPT #{level.upcase} Mini Test",
            sections:        sections,
            total_questions: total,
            pass_score:      pass_at,
            time_limit_min:  30,
            ai_generated:    true
          )
        end

        render json: test_summary(test).merge(id: test.id), status: :created
      end

      # POST /api/v1/level_tests/:id/submit
      # body: { answers: [{ question_id:, section_index:, answer_index: }, ...] }
      def submit
        test    = LevelTest.find(params[:id])
        # A scalar in the array (`answers: [1, 2]`) has no #to_unsafe_h and used
        # to raise NoMethodError → 500; skip anything that isn't an object.
        answers = Array(params[:answers]).filter_map { |a| a.to_unsafe_h if a.respond_to?(:to_unsafe_h) }

        result  = test.grade(answers)
        # Passing at your current level promotes you — but not past a level you
        # skipped. `level_after` is known here, so it goes in on the insert
        # rather than in a second, validation-skipping UPDATE, and the promotion
        # is atomic with the attempt it is based on.
        next_level = result[:passed] ? LevelTest::LEVEL_UP_MAP[test.jlpt_level] : nil
        leveling_up = next_level.present? && current_user.jlpt_level == test.jlpt_level

        attempt = nil
        ActiveRecord::Base.transaction do
          attempt = LevelTestAttempt.create!(
            user_id:         current_user.id,
            level_test_id:   test.id,
            answers:         answers,
            score:           result[:score],
            total_questions: result[:total],
            passed:          result[:passed],
            jlpt_level:      test.jlpt_level,
            level_before:    current_user.jlpt_level,
            level_after:     (next_level if leveling_up),
            completed_at:    Time.current
          )

          current_user.update!(jlpt_level: next_level) if leveling_up
        end

        level_up_info = leveling_up ? { from: test.jlpt_level, to: next_level } : nil

        render json: {
          attempt_id:    attempt.id,
          score:         result[:score],
          total:         result[:total],
          passed:        result[:passed],
          pass_score:    test.pass_score,
          per_section:   result[:per_section],
          level_up:      level_up_info,
          # Includes answer_index + explanation_vi, which `show` withholds.
          sections:      test.sections_with_answers(answers)
        }
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
