# frozen_string_literal: true

module Api
  module V1
    # Universal SRS flashcards over vocabulary + kanji + grammar points.
    # The queries live in DueCardsQuery / NewCardsQuery, the JSON shape in
    # CardPayload and the quiz generation in FlashcardQuiz; these actions only
    # read params and render.
    class FlashcardsController < BaseController
      RANDOM_DEFAULTS = {
        "vocabulary"    => { param: :vocab,   default: 10, max: 50 },
        "kanji"         => { param: :kanji,   default: 5,  max: 30 },
        "grammar_point" => { param: :grammar, default: 3,  max: 15 }
      }.freeze

      # GET /api/v1/flashcards/due
      # ?type=all|vocabulary|kanji|grammar_point  (default: all)
      # ?level=n5|n4|...                          (optional)
      # Returns up to 20 cards due today from UserCardProgress.
      def due
        result = DueCardsQuery.new(current_user, type: card_type_param("all"), level: level_param).call
        cards  = result.each_card { |progress, card| CardPayload.from_progress(progress, card) }

        render json: { total_due: result.total, cards: cards }
      end

      # GET /api/v1/flashcards/new
      # ?type=all|vocabulary|kanji|grammar_point  (default: vocabulary)
      # ?level=n5|n4|...                          (default: user's JLPT level)
      # Returns cards not yet in UserCardProgress, capped per type per day.
      def new_cards
        type = card_type_param("vocabulary")
        return render_invalid_param("type") unless type == "all" || CardCatalog::TYPES.include?(type)

        result = NewCardsQuery.new(current_user, type: type, level: level_param_or_user).call

        render json: {
          total_new: result.total,
          cards:     result.cards.map { |card_type, card| CardPayload.for_new_card(card_type, card) }
        }
      end

      # POST /api/v1/flashcards/review
      # body: { card_type, card_id, grade: 0-3 }
      # Creates or updates UserCardProgress using SM-2.
      def review
        card_type = params.require(:card_type).to_s
        card_id   = params.require(:card_id).to_i
        grade     = Integer(params.require(:grade))

        return render_invalid_param("card_type") unless CardCatalog::TYPES.include?(card_type)
        unless (0..3).include?(grade)
          return render_unprocessable("grade phải từ 0 đến 3")
        end

        progress = current_user.user_card_progresses
                               .find_or_initialize_by(card_type: card_type, card_id: card_id)

        # Only a brand-new row needs the content record (for its JLPT level).
        # An existing row stays reviewable even if the card was since deleted.
        if progress.new_record?
          card = CardCatalog.model_for(card_type).find_by(id: card_id)
          return render_not_found(card_type.capitalize) unless card

          progress.assign_attributes(SrsService.initial_state.merge(jlpt_level: card.jlpt_level))
        end

        progress = SrsReviewService.apply!(user: current_user, progress: progress, grade: grade)

        render json: {
          next_due:              progress.due_date,
          interval:              progress.interval,
          ease_factor:           progress.ease_factor.to_f,
          cards_remaining_today: current_user.user_card_progresses
                                             .due_today
                                             .where.not(id: progress.id)
                                             .count
        }
      # ArgumentError: a non-numeric string. TypeError: a nested object or array,
      # which Integer() refuses to coerce — both are a bad param, not a 500.
      rescue ArgumentError, TypeError
        render_unprocessable("grade không hợp lệ")
      end

      # GET /api/v1/flashcards/random
      # ?level=n5  ?vocab=10  ?kanji=5  ?grammar=3
      # Returns a shuffled mix of random cards, with current learned status.
      def random
        level   = level_param_or_user
        learned = learned_lookup(level)

        cards = RANDOM_DEFAULTS.flat_map do |card_type, config|
          scope = CardCatalog.model_for(card_type).by_level(level)

          CardCatalog.in_random_order(scope).limit(random_count(config)).map do |card|
            CardPayload.for_new_card(card_type, card)
                       .merge(learned: learned.include?("#{card_type}:#{card.id}"))
          end
        end

        render json: { level: level, cards: cards.shuffle }
      end

      # POST /api/v1/flashcards/quiz
      # body: { cards: [{card_type, card_id}, ...] }
      # Returns an MCQ question per card with 4 shuffled options.
      def generate_quiz
        render json: { questions: FlashcardQuiz.new(params.require(:cards)).call }
      end

      # POST /api/v1/flashcards/status
      # body: { card_type, card_id, learned: true/false }
      def update_status
        card_type = params.require(:card_type).to_s
        return render_invalid_param("card_type") unless CardCatalog::TYPES.include?(card_type)

        card = CardCatalog.model_for(card_type).find_by(id: params.require(:card_id).to_i)
        return render_not_found(card_type.capitalize) unless card

        progress = UserCardProgress.set_learned!(
          current_user, card_type: card_type, card: card, learned: params.require(:learned)
        )

        render json: { learned: progress.learned }
      end

      # POST /api/v1/flashcards/status/bulk
      # body: { results: [{card_type, card_id, learned}, ...] }
      # Bulk-updates the learned flag after a quiz session. Entries naming an
      # unknown type or a deleted card are skipped, not failed.
      def bulk_update_status
        updated = params.require(:results).filter_map do |entry|
          card_type = entry[:card_type].to_s
          next unless CardCatalog::TYPES.include?(card_type)

          card = CardCatalog.model_for(card_type).find_by(id: entry[:card_id].to_i)
          next unless card

          progress = UserCardProgress.set_learned!(
            current_user, card_type: card_type, card: card, learned: entry[:learned]
          )
          { card_type: card_type, card_id: card.id, learned: progress.learned }
        end

        render json: { updated: updated.size, results: updated }
      end

      private

      def card_type_param(fallback)
        params[:type].presence || fallback
      end

      # "type:id" set of the cards the user has already marked learned at this
      # level, so `random` can flag them without an N+1.
      def learned_lookup(level)
        current_user.user_card_progresses
                    .for_level(level)
                    .learned
                    .pluck(:card_type, :card_id)
                    .to_set { |type, id| "#{type}:#{id}" }
      end

      def random_count(config)
        requested = params[config[:param]].to_i.nonzero? || config[:default]
        requested.clamp(1, config[:max])
      end
    end
  end
end
