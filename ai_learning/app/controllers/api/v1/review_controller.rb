# frozen_string_literal: true

module Api
  module V1
    class ReviewController < BaseController
      self.not_found_label = "Progress"

      # The review screen's 4-button scale (0/3/4/5) mapped onto the SM-2 grades
      # (0-3) the SRS calculator works in.
      QUALITY_TO_GRADE = { 0 => 0, 3 => 1, 4 => 2, 5 => 3 }.freeze

      # GET /api/v1/review/queue
      # Returns cards due today from user_card_progresses (all types or ?type=vocabulary).
      def queue
        result = DueCardsQuery.new(
          current_user,
          type:  params[:type].presence || "vocabulary",
          level: level_param
        ).call

        cards = result.each_card { |progress, card| serialize_progress(progress, card) }

        render json: { total_due: result.total, cards: cards }
      end

      # POST /api/v1/review/submit
      # Body: { progress_id: integer, quality: 0|3|4|5 }
      def submit
        progress = current_user.user_card_progresses.find(params.require(:progress_id))
        quality  = Integer(params.require(:quality))

        grade = QUALITY_TO_GRADE[quality]
        unless grade
          return render_unprocessable("quality phải là 0, 3, 4 hoặc 5")
        end

        progress = SrsReviewService.apply!(user: current_user, progress: progress, grade: grade)

        render json: {
          next_due:    progress.due_date,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f
        }
      # ArgumentError: a non-numeric string. TypeError: a nested object or array,
      # which Integer() refuses to coerce — both are a bad param, not a 500.
      rescue ArgumentError, TypeError
        render_unprocessable("quality không hợp lệ")
      end

      private

      # This screen nests the content under a key named after the card type,
      # unlike the flat shape the flashcard endpoints return.
      def serialize_progress(progress, card)
        {
          id:          progress.id,
          card_type:   progress.card_type,
          due_date:    progress.due_date,
          repetitions: progress.repetitions,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f,
          progress.card_type.to_sym => CardCatalog.summary_for(progress.card_type, card)
        }
      end
    end
  end
end
