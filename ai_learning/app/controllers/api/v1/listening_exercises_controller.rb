# frozen_string_literal: true

module Api
  module V1
    class ListeningExercisesController < BaseController
      self.not_found_label = "Bài luyện nghe"

      # GET /api/v1/listening_exercises?level=n3&topic=カフェでの会話
      # Returns cached DB exercises first; generates one if none exist.
      def index
        level = params[:level].presence || current_user.jlpt_level
        topic = params[:topic].presence

        scope = ListeningExercise.ai_generated.by_level(level)
        scope = scope.by_topic(topic) if topic
        exercises = scope.order(created_at: :desc).limit(12)

        if exercises.any?
          render json: exercises.map { |e| serialize_exercise(e) }
        else
          exercise = generate_and_save!(
            jlpt_level: level,
            topic:      topic || "日常会話"
          )
          render json: [ serialize_exercise(exercise) ]
        end
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
        jlpt_level = params[:jlpt_level].presence || current_user.jlpt_level

        exercise = generate_and_save!(jlpt_level: jlpt_level, topic: topic)
        render json: serialize_exercise(exercise), status: :created
      end

      # POST /api/v1/listening_exercises/:id/submit
      # body: { answers: [{question_index, answer_index}, ...], speech_rate }
      def submit
        exercise = ListeningExercise.find(params[:id])
        answers  = params.require(:answers)
        speech_rate = params[:speech_rate].to_f.clamp(0.5, 2.0)

        # Validate all answers
        results = answers.map do |a|
          question_index = a[:question_index].to_i
          answer_index = a[:answer_index].to_i

          question = exercise.questions[question_index]
          return render json: { error: "Câu hỏi không tồn tại" }, status: :not_found unless question

          correct_index = question["correct_index"].to_i
          correct = correct_index == answer_index
          correct_option = Array(question["options"])[correct_index]

          {
            correct: correct,
            correct_index: correct_index,
            explanation_vi: correct ? "Chính xác! 🎉" : "Đáp án đúng là: #{correct_option}"
          }
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
        attempts = current_user.listening_attempts.includes(:listening_exercise)

        if attempts.empty?
          return render json: {
            total_attempts: 0,
            avg_score: 0.0,
            by_speed: {}
          }
        end

        total_questions = attempts.sum(:total_questions)
        avg_score = total_questions.zero? ? 0.0 : (attempts.sum(:score).to_f / total_questions).round(2)

        correct_by_rate = attempts.group(:speech_rate).sum(:score)
        total_by_rate   = attempts.group(:speech_rate).sum(:total_questions)
        by_speed = correct_by_rate.each_with_object({}) do |(rate, correct), h|
          total = total_by_rate[rate].to_f
          h[rate.to_s] = total.zero? ? 0.0 : (correct.to_f / total).round(2)
        end

        render json: {
          total_attempts: attempts.count,
          avg_score: avg_score,
          by_speed: by_speed
        }
      end

      private

      def generate_and_save!(jlpt_level:, topic:)
        prompt = Prompts::ListeningExercisePrompt.build(
          topic:      topic,
          jlpt_level: jlpt_level
        )

        raw = AiCacheService.fetch(prompt, skip_cache: true) do
          ClaudeService.complete(
            prompt:     prompt,
            max_tokens: 2048,
            log_usage:  { feature: "listening_generate", user_id: current_user.id }
          )
        end
        data = parse_ai_json(raw)

        ListeningExercise.create!(
          title:       data["title"],
          script_ja:   data["script_ja"],
          script_vi:   data["script_vi"],
          jlpt_level:  jlpt_level,
          topic:       topic,
          questions:   data["questions"] || [],
          ai_generated: true
        )
      rescue ActiveRecord::RecordInvalid => e
        # AI returned syntactically valid JSON but with missing/blank fields.
        # Surface as a ServiceError so it reuses the AI-error rescue (503)
        # instead of leaking as a 500.
        raise ClaudeService::ServiceError, "AI returned incomplete exercise data: #{e.message}"
      end

      def serialize_exercise(exercise)
        {
          id:            exercise.id,
          title:         exercise.title,
          script_ja:     exercise.script_ja,
          script_vi:     exercise.script_vi,
          jlpt_level:    exercise.jlpt_level,
          topic:         exercise.topic,
          questions:     exercise.questions,
          ai_generated:  exercise.ai_generated,
          created_at:    exercise.created_at
        }
      end
    end
  end
end
