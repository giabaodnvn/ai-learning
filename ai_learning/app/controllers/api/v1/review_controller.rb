# frozen_string_literal: true

module Api
  module V1
    class ReviewController < BaseController

      # GET /api/v1/review/queue
      # Returns vocabulary cards due today for the current user (max 20)
      def queue
        cards = current_user.user_vocabulary_progresses
                            .includes(:vocabulary)
                            .where("due_date <= ?", Date.current)
                            .order(:due_date)
                            .limit(20)

        render json: {
          total_due: cards.size,
          cards:     cards.map { |p| serialize_progress(p) }
        }, status: :ok
      end

      # POST /api/v1/review/submit
      # Body: { progress_id: integer, quality: 0..5 }
      def submit
        progress = current_user.user_vocabulary_progresses.find(params.require(:progress_id))
        quality  = Integer(params.require(:quality))

        unless (0..5).include?(quality)
          return render json: { error: "quality phải từ 0 đến 5" }, status: :unprocessable_entity
        end

        progress.review!(quality)

        render json: {
          next_due:    progress.due_date,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render_not_found("Progress")
      rescue ArgumentError
        render json: { error: "quality không hợp lệ" }, status: :unprocessable_entity
      end

      private

      def serialize_progress(p)
        {
          id:          p.id,
          due_date:    p.due_date,
          repetitions: p.repetitions,
          interval:    p.interval,
          ease_factor: p.ease_factor.to_f,
          vocabulary:  {
            id:             p.vocabulary.id,
            word:           p.vocabulary.word,
            reading:        p.vocabulary.reading,
            meaning_vi:     p.vocabulary.meaning_vi,
            part_of_speech: p.vocabulary.part_of_speech,
            jlpt_level:     p.vocabulary.jlpt_level
          }
        }
      end
    end
  end
end
