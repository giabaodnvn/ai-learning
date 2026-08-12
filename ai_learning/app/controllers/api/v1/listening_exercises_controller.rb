# frozen_string_literal: true

module Api
  module V1
    class ListeningExercisesController < BaseController
      include Api::V1::Concerns::GeneratedContent

      self.not_found_label = "Bài luyện nghe"

      # GET /api/v1/listening_exercises?level=n3&topic=カフェでの会話
      # Returns cached DB exercises first; generates one if none exist.
      DEFAULT_TOPIC = "日常会話"

      def index
        exercises = listed_content(ListeningExercise, default_topic: DEFAULT_TOPIC)

        render json: exercises.map { |e| serialize_exercise(e) }
      end

      # GET /api/v1/listening_exercises/:id
      def show
        exercise = ListeningExercise.find(params[:id])
        render json: serialize_exercise(exercise)
      end

      # POST /api/v1/listening_exercises/generate
      # body: { topic, jlpt_level (optional) }
      def generate
        topic      = params.require(:topic)
        jlpt_level = level_param_or_user(:jlpt_level)

        exercise = generate_and_save!(jlpt_level: jlpt_level, topic: topic)
        render json: serialize_exercise(exercise), status: :created
      end

      # POST /api/v1/listening_exercises/:id/submit
      # body: { answers: [{question_index, answer_index}, ...], speech_rate }
      def submit
        exercise = ListeningExercise.find(params[:id])
        # A scalar in the array (`answers: [1, 2]`) has no #to_unsafe_h and its
        # `#[]` raises TypeError on a symbol key → 500; skip anything that isn't
        # an object, as LevelTestsController#submit does.
        answers  = params.require(:answers).filter_map { |a| a if a.respond_to?(:to_unsafe_h) }
        speech_rate = params[:speech_rate].to_f.clamp(0.5, 2.0)

        # Validate all answers
        results = answers.map do |a|
          result = graded_answer(
            exercise.questions[a[:question_index].to_i],
            a[:answer_index].to_i,
            answer_key: "correct_index"
          )
          return render_question_not_found unless result

          result
        end

        # Save attempt for stats
        score = results.count { |r| r[:correct] }
        total = exercise.questions.size
        ListeningAttempt.create!(
          user: current_user,
          listening_exercise: exercise,
          score: score,
          total_questions: total,
          speech_rate: speech_rate
        )

        render json: {
          results: results,
          score: score,
          total: total,
          percentage: total.zero? ? 0.0 : ((score.to_f / total) * 100).round(1)
        }
      end

      # GET /api/v1/listening_exercises/stats
      def stats
        attempts = current_user.listening_attempts

        # Three queries: the row count, then correct/total grouped by speed.
        # The overall accuracy is derived from those groups rather than costing
        # two more aggregate round-trips.
        correct_by_rate = attempts.group(:speech_rate).sum(:score)
        total_by_rate   = attempts.group(:speech_rate).sum(:total_questions)

        answered = total_by_rate.values.sum
        correct  = correct_by_rate.values.sum

        render json: {
          total_attempts: attempts.count,
          avg_score:      ratio(correct, answered),
          by_speed:       correct_by_rate.to_h { |rate, hits| [ rate.to_s, ratio(hits, total_by_rate[rate]) ] }
        }
      end

      private

      # Accuracy as a 0.0–1.0 fraction; 0.0 when nothing has been answered.
      def ratio(hits, total)
        total.to_i.zero? ? 0.0 : (hits.to_f / total).round(2)
      end

      def generate_and_save!(jlpt_level:, topic:)
        data = AiJson.complete(
          prompt:  Prompts::ListeningExercisePrompt.build(topic: topic, jlpt_level: jlpt_level),
          feature: "listening_generate",
          user_id: current_user.id
        )

        create_from_ai!("exercise data") do
          ListeningExercise.create!(
            title:       data["title"],
            script_ja:   data["script_ja"],
            script_vi:   data["script_vi"],
            jlpt_level:  jlpt_level,
            topic:       topic,
            questions:   data["questions"] || [],
            ai_generated: true
          )
        end
      end

      def serialize_exercise(exercise)
        content_json(exercise, script_ja: exercise.script_ja, script_vi: exercise.script_vi)
      end
    end
  end
end
