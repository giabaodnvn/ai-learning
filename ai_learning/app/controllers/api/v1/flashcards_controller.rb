# frozen_string_literal: true

module Api
  module V1
    class FlashcardsController < BaseController

      # GET /api/v1/flashcards/due
      # Returns up to 20 cards whose due_date is today or in the past.
      def due
        cards = current_user.user_vocabulary_progresses
                            .includes(:vocabulary)
                            .where("due_date <= ?", Date.current)
                            .order(:due_date)
                            .limit(20)

        render json: {
          total_due: current_user.user_vocabulary_progresses
                                 .where("due_date <= ?", Date.current).count,
          cards:     cards.map { |p| serialize_card(p) }
        }, status: :ok
      end

      # GET /api/v1/flashcards/new
      # Returns up to 10 vocabulary items at the user's JLPT level
      # that the user has not yet started studying.
      def new_cards
        studied_ids = current_user.user_vocabulary_progresses.select(:vocabulary_id)

        vocabs = Vocabulary.where(jlpt_level: current_user.jlpt_level)
                           .where.not(id: studied_ids)
                           .order(:id)
                           .limit(10)

        render json: {
          total_new: Vocabulary.where(jlpt_level: current_user.jlpt_level)
                               .where.not(id: studied_ids).count,
          cards:     vocabs.map { |v| serialize_vocab(v) }
        }, status: :ok
      end

      # POST /api/v1/flashcards/:vocab_id/review
      # Body: { grade: 0-3 }
      # 0 = again, 1 = hard, 2 = good, 3 = easy
      def review
        vocabulary = Vocabulary.find(params[:vocab_id])
        grade      = Integer(params.require(:grade))

        unless (0..3).include?(grade)
          return render json: { error: "grade phải từ 0 đến 3" },
                        status: :unprocessable_entity
        end

        progress = current_user.user_vocabulary_progresses
                               .find_or_initialize_by(vocabulary: vocabulary)

        # Seed defaults for a card being reviewed for the first time.
        if progress.new_record?
          initial = SrsService.initial_state
          progress.assign_attributes(initial)
        end

        result = SrsService.calculate_next_review(
          ease_factor:  progress.ease_factor.to_f,
          interval:     progress.interval,
          repetitions:  progress.repetitions,
          grade:        grade
        )

        progress.assign_attributes(
          interval:         result[:new_interval],
          ease_factor:      result[:new_ease_factor],
          repetitions:      result[:new_repetitions],
          due_date:         result[:due_date],
          last_reviewed_at: Time.current
        )
        progress.save!

        cards_remaining = current_user.user_vocabulary_progresses
                                      .where("due_date <= ?", Date.current)
                                      .where.not(id: progress.id)
                                      .count

        render json: {
          next_due:              progress.due_date,
          interval:              progress.interval,
          ease_factor:           progress.ease_factor.to_f,
          cards_remaining_today: cards_remaining
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render_not_found("Vocabulary")
      rescue ArgumentError
        render json: { error: "grade không hợp lệ" }, status: :unprocessable_entity
      end

      private

      def serialize_card(progress)
        {
          id:          progress.id,
          due_date:    progress.due_date,
          repetitions: progress.repetitions,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f,
          vocabulary:  serialize_vocab(progress.vocabulary)
        }
      end

      def serialize_vocab(vocab)
        {
          id:             vocab.id,
          word:           vocab.word,
          reading:        vocab.reading,
          meaning_vi:     vocab.meaning_vi,
          part_of_speech: vocab.part_of_speech,
          jlpt_level:     vocab.jlpt_level
        }
      end
    end
  end
end
