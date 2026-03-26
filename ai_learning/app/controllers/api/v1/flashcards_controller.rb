# frozen_string_literal: true

module Api
  module V1
    class FlashcardsController < BaseController

      # GET /api/v1/flashcards/due
      # ?type=all|vocabulary|kanji|grammar_point  (default: all)
      # ?level=n5|n4|...                          (optional)
      # Returns up to 20 cards due today from UserCardProgress.
      def due
        type  = params[:type].presence || "all"
        level = params[:level].presence&.downcase

        scope = current_user.user_card_progresses
                            .where("due_date <= ?", Date.current)
                            .order(:due_date)

        scope = scope.where(card_type: type) unless type == "all"
        scope = scope.where(jlpt_level: level) if level

        total      = scope.count
        progresses = scope.limit(20).to_a
        cards      = batch_load_cards(progresses)

        render json: {
          total_due: total,
          cards:     progresses.filter_map { |p| serialize_progress(p, cards) }
        }
      end

      # GET /api/v1/flashcards/new
      # ?type=vocabulary|kanji|grammar_point  (default: vocabulary)
      # ?level=n5|n4|...                      (default: user's JLPT level)
      # Returns new cards not yet in UserCardProgress.
      def new_cards
        type  = params[:type].presence || "vocabulary"
        level = params[:level].presence&.downcase || current_user.jlpt_level

        # ?type=all returns new cards across all three types (respects per-type limits)
        if type == "all"
          all_cards  = []
          total_new  = 0
          UserCardProgress::CARD_TYPES.each do |t|
            studied = current_user.user_card_progresses.where(card_type: t).pluck(:card_id)
            lim     = UserCardProgress::NEW_PER_DAY.fetch(t, 10)
            model   = source_model(t)
            scope   = model.by_level(level).where.not(id: studied).order(:id)
            total_new  += scope.count
            all_cards  += scope.limit(lim).map { |item| serialize_new_card(t, item) }
          end
          return render json: { total_new: total_new, cards: all_cards }
        end

        unless UserCardProgress::CARD_TYPES.include?(type)
          return render json: { error: "type không hợp lệ" }, status: :unprocessable_entity
        end

        studied_ids = current_user.user_card_progresses
                                  .where(card_type: type)
                                  .pluck(:card_id)

        limit     = UserCardProgress::NEW_PER_DAY.fetch(type, 10)
        model     = source_model(type)
        items     = model.by_level(level).where.not(id: studied_ids).order(:id).limit(limit)
        total_new = model.by_level(level).where.not(id: studied_ids).count

        render json: {
          total_new: total_new,
          cards:     items.map { |item| serialize_new_card(type, item) }
        }
      end

      # POST /api/v1/flashcards/review
      # body: { card_type, card_id, grade: 0-3 }
      # Creates or updates UserCardProgress using SM-2.
      def review
        card_type = params.require(:card_type).to_s
        card_id   = params.require(:card_id).to_i
        grade     = Integer(params.require(:grade))

        unless UserCardProgress::CARD_TYPES.include?(card_type)
          return render json: { error: "card_type không hợp lệ" }, status: :unprocessable_entity
        end
        unless (0..3).include?(grade)
          return render json: { error: "grade phải từ 0 đến 3" }, status: :unprocessable_entity
        end

        progress = current_user.user_card_progresses
                               .find_or_initialize_by(card_type: card_type, card_id: card_id)

        if progress.new_record?
          card_record = source_model(card_type).find_by(id: card_id)
          return render_not_found(card_type.capitalize) unless card_record

          progress.assign_attributes(
            SrsService.initial_state.merge(jlpt_level: card_record.jlpt_level)
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
          last_reviewed_at: Time.current
        )
        progress.save!

        cards_remaining = current_user.user_card_progresses
                                      .where("due_date <= ?", Date.current)
                                      .where.not(id: progress.id)
                                      .count

        render json: {
          next_due:              progress.due_date,
          interval:              progress.interval,
          ease_factor:           progress.ease_factor.to_f,
          cards_remaining_today: cards_remaining
        }
      rescue ArgumentError
        render json: { error: "grade không hợp lệ" }, status: :unprocessable_entity
      end

      # POST /api/v1/flashcards/:vocab_id/review  (legacy — vocabulary only)
      # Kept for backward compatibility. Delegates to the new review logic.
      def review_legacy
        params[:card_type] = "vocabulary"
        params[:card_id]   = params[:vocab_id]
        review
      end

      # ── Learn mode (random pick) ──────────────────────────────────────────────

      # GET /api/v1/flashcards/random
      # ?level=n5  ?vocab=10  ?kanji=5  ?grammar=3
      # Returns a shuffled mix of random cards, with current learned status.
      def random
        level   = (params[:level].presence || current_user.jlpt_level).downcase
        v_count = clamp_count(params[:vocab].to_i.nonzero?   || 10, 50)
        k_count = clamp_count(params[:kanji].to_i.nonzero?   || 5,  30)
        g_count = clamp_count(params[:grammar].to_i.nonzero? || 3,  15)

        vocab_cards   = Vocabulary.by_level(level).order("RAND()").limit(v_count)
        kanji_cards   = Kanji.by_level(level).order("RAND()").limit(k_count)
        grammar_cards = GrammarPoint.by_level(level).order("RAND()").limit(g_count)

        # Build learned lookup: "type:id" → true/false
        learned_set = current_user.user_card_statuses
          .where(jlpt_level: level)
          .learned
          .each_with_object(Set.new) { |s, set| set << "#{s.card_type}:#{s.card_id}" }

        cards = [
          *vocab_cards.map   { |c| random_card_json("vocabulary",    c, learned_set) },
          *kanji_cards.map   { |c| random_card_json("kanji",         c, learned_set) },
          *grammar_cards.map { |c| random_card_json("grammar_point", c, learned_set) },
        ].shuffle

        render json: { level: level, cards: cards }
      end

      # POST /api/v1/flashcards/quiz
      # body: { cards: [{card_type, card_id}, ...] }
      # Returns MCQ question for each card with 4 shuffled options.
      # The `correct` field (index 0-3) is included — this is intentional for a learning app.
      def generate_quiz
        items = params.require(:cards)

        questions = items.filter_map do |item|
          ct  = item[:card_type].to_s
          cid = item[:card_id].to_i
          next unless UserCardProgress::CARD_TYPES.include?(ct)

          card = source_model(ct).find_by(id: cid)
          next unless card

          correct_text = quiz_answer(ct, card)

          wrong = source_model(ct)
            .where.not(id: cid)
            .order("RAND()")
            .limit(6)
            .map  { |d| quiz_answer(ct, d) }
            .reject { |w| w.blank? || w == correct_text }
            .uniq
            .first(3)

          wrong += ["—"] * (3 - wrong.size) if wrong.size < 3

          options = ([correct_text] + wrong).shuffle

          {
            card_type:     ct,
            card_id:       cid,
            question:      quiz_question(ct, card),
            question_hint: quiz_hint(ct, card),
            options:       options,
            correct:       options.index(correct_text)
          }
        end

        render json: { questions: questions }
      end

      # POST /api/v1/flashcards/status
      # body: { card_type, card_id, learned: true/false }
      # Creates or updates learned status for a card.
      def update_status
        card_type = params.require(:card_type).to_s
        card_id   = params.require(:card_id).to_i
        learned   = params.require(:learned)

        unless UserCardProgress::CARD_TYPES.include?(card_type)
          return render json: { error: "card_type không hợp lệ" }, status: :unprocessable_entity
        end

        card = source_model(card_type).find_by(id: card_id)
        return render json: { error: "#{card_type} not found" }, status: :not_found unless card

        status = current_user.user_card_statuses.find_or_initialize_by(
          card_type: card_type, card_id: card_id
        )
        status.assign_attributes(jlpt_level: card.jlpt_level, learned: learned)
        status.save!

        render json: { learned: status.learned }
      end

      # POST /api/v1/flashcards/status/bulk
      # body: { results: [{card_type, card_id, learned}, ...] }
      # Bulk-updates status after a quiz session.
      def bulk_update_status
        results = params.require(:results)

        updated = results.filter_map do |r|
          ct      = r[:card_type].to_s
          cid     = r[:card_id].to_i
          learned = r[:learned]
          next unless UserCardProgress::CARD_TYPES.include?(ct)

          card = source_model(ct).find_by(id: cid)
          next unless card

          status = current_user.user_card_statuses.find_or_initialize_by(
            card_type: ct, card_id: cid
          )
          status.assign_attributes(jlpt_level: card.jlpt_level, learned: learned)
          status.save!
          { card_type: ct, card_id: cid, learned: status.learned }
        end

        render json: { updated: updated.size, results: updated }
      end

      private

      # ── Model helpers ────────────────────────────────────────────────────────

      def source_model(type)
        case type
        when "vocabulary"    then Vocabulary
        when "kanji"         then Kanji
        when "grammar_point" then GrammarPoint
        end
      end

      # Batch-load all card records to avoid N+1 queries.
      def batch_load_cards(progresses)
        result = {}
        progresses.group_by(&:card_type).each do |type, progs|
          ids     = progs.map(&:card_id)
          records = source_model(type).where(id: ids).index_by(&:id)
          records.each { |id, rec| result["#{type}:#{id}"] = rec }
        end
        result
      end

      # ── Serialization ────────────────────────────────────────────────────────

      def serialize_progress(progress, cards)
        card = cards["#{progress.card_type}:#{progress.card_id}"]
        return nil unless card

        base_attrs(progress).merge(card_attrs(progress.card_type, card))
      end

      def serialize_new_card(type, card)
        base = {
          progress_id: nil,
          card_type:   type,
          card_id:     card.id,
          jlpt_level:  card.jlpt_level,
          due_date:    Date.current.to_s,
          repetitions: 0,
          interval:    1,
          ease_factor: SrsService::DEFAULT_EASE
        }
        base.merge(card_attrs(type, card))
      end

      def base_attrs(progress)
        {
          progress_id: progress.id,
          card_type:   progress.card_type,
          card_id:     progress.card_id,
          jlpt_level:  progress.jlpt_level,
          due_date:    progress.due_date,
          repetitions: progress.repetitions,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f
        }
      end

      def card_attrs(type, card)
        case type
        when "vocabulary"
          {
            word:           card.word,
            reading:        card.reading,
            meaning_vi:     card.meaning_vi,
            part_of_speech: card.part_of_speech
          }
        when "kanji"
          {
            character:      card.character,
            onyomi:         parse_json(card.onyomi),
            kunyomi:        parse_json(card.kunyomi),
            meaning_vi:     card.meaning_vi,
            stroke_count:   card.stroke_count,
            vocab_examples: parse_json(card.vocab_examples)
          }
        when "grammar_point"
          {
            pattern:        card.pattern,
            explanation_vi: card.explanation_vi,
            examples:       parse_json(card.examples),
            notes_vi:       card.notes_vi
          }
        end
      end

      def parse_json(value)
        return value if value.is_a?(Array) || value.is_a?(Hash)
        JSON.parse(value.to_s)
      rescue JSON::ParseError
        []
      end

      # ── Learn mode helpers ────────────────────────────────────────────────────

      def random_card_json(type, card, learned_set)
        {
          progress_id: nil,
          card_type:   type,
          card_id:     card.id,
          jlpt_level:  card.jlpt_level,
          due_date:    Date.current.to_s,
          repetitions: 0,
          interval:    1,
          ease_factor: SrsService::DEFAULT_EASE,
          learned:     learned_set.include?("#{type}:#{card.id}")
        }.merge(card_attrs(type, card))
      end

      def clamp_count(val, max)
        [[val.to_i, 1].max, max].min
      end

      # Short answer string used as correct MCQ option
      def quiz_answer(card_type, card)
        case card_type
        when "vocabulary"    then card.meaning_vi.to_s.split(/[,、]/).first.strip
        when "kanji"         then card.meaning_vi.to_s.split(/[,、]/).first.strip
        when "grammar_point" then card.explanation_vi.to_s.truncate(60)
        end.to_s
      end

      # What to show as the question (front of quiz card)
      def quiz_question(card_type, card)
        case card_type
        when "vocabulary"    then card.word
        when "kanji"         then card.character
        when "grammar_point" then card.pattern
        end
      end

      # Small hint shown under the question
      def quiz_hint(card_type, card)
        case card_type
        when "vocabulary"    then card.reading
        when "kanji"
          onyomi = parse_json(card.onyomi).first
          "#{card.stroke_count} nét#{onyomi ? " · #{onyomi}" : ""}"
        when "grammar_point" then nil
        end
      end
    end
  end
end
