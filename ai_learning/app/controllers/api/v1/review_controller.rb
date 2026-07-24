# frozen_string_literal: true

module Api
  module V1
    class ReviewController < BaseController
      self.not_found_label = "Progress"

      # GET /api/v1/review/queue
      # Returns cards due today from user_card_progresses (all types or ?type=vocabulary).
      # Previously used legacy user_vocabulary_progresses (always empty — migrated).
      def queue
        type  = params[:type].presence || "vocabulary"
        level = params[:level].presence&.downcase

        scope = current_user.user_card_progresses
                            .where("due_date <= ?", Date.current)
                            .order(:due_date)

        scope = scope.where(card_type: type) unless type == "all"
        scope = scope.where(jlpt_level: level) if level

        total      = scope.count
        progresses = scope.limit(20).to_a

        # Batch-load the content records
        vocab_ids   = progresses.select { |p| p.card_type == "vocabulary" }.map(&:card_id)
        kanji_ids   = progresses.select { |p| p.card_type == "kanji" }.map(&:card_id)
        grammar_ids = progresses.select { |p| p.card_type == "grammar_point" }.map(&:card_id)

        vocabs   = Vocabulary.where(id: vocab_ids).index_by(&:id)
        kanjis   = kanji_ids.any? ? Kanji.where(id: kanji_ids).index_by(&:id) : {}
        grammars = grammar_ids.any? ? GrammarPoint.where(id: grammar_ids).index_by(&:id) : {}

        cards = progresses.filter_map { |p| serialize_progress(p, vocabs, kanjis, grammars) }

        render json: { total_due: total, cards: cards }
      end

      # POST /api/v1/review/submit
      # Body: { progress_id: integer, quality: 0|3|4|5 }
      # Maps review-page quality scale (0,3,4,5) → SM-2 grade (0-3), updates UserCardProgress.
      def submit
        progress = current_user.user_card_progresses.find(params.require(:progress_id))
        quality  = Integer(params.require(:quality))

        unless [ 0, 3, 4, 5 ].include?(quality)
          return render json: { error: "quality phải là 0, 3, 4 hoặc 5" }, status: :unprocessable_entity
        end

        grade = quality_to_grade(quality)

        progress = SrsReviewService.apply!(user: current_user, progress: progress, grade: grade)

        render json: {
          next_due:    progress.due_date,
          interval:    progress.interval,
          ease_factor: progress.ease_factor.to_f
        }
      rescue ArgumentError
        render json: { error: "quality không hợp lệ" }, status: :unprocessable_entity
      end

      private

      # Maps review-page 4-button quality (0,3,4,5) → SM-2 grade (0-3)
      def quality_to_grade(quality)
        case quality
        when 5 then 3  # Dễ  → easy
        when 4 then 2  # Ổn  → good
        when 3 then 1  # Khó → hard
        else 0         # Quên → again
        end
      end

      def serialize_progress(p, vocabs, kanjis, grammars)
        content = case p.card_type
        when "vocabulary"   then serialize_vocab(vocabs[p.card_id])
        when "kanji"        then serialize_kanji(kanjis[p.card_id])
        when "grammar_point" then serialize_grammar(grammars[p.card_id])
        end
        return nil unless content

        {
          id:          p.id,
          card_type:   p.card_type,
          due_date:    p.due_date,
          repetitions: p.repetitions,
          interval:    p.interval,
          ease_factor: p.ease_factor.to_f,
          **content
        }
      end

      def serialize_vocab(v)
        return nil unless v
        {
          vocabulary: {
            id:             v.id,
            word:           v.word,
            reading:        v.reading,
            meaning_vi:     v.meaning_vi,
            part_of_speech: v.part_of_speech,
            jlpt_level:     v.jlpt_level
          }
        }
      end

      def serialize_kanji(k)
        return nil unless k
        onyomi = k.onyomi.is_a?(String) ? JSON.parse(k.onyomi) : Array(k.onyomi)
        {
          kanji: {
            id:         k.id,
            character:  k.character,
            reading_on: onyomi.join("、"),
            meaning_vi: k.meaning_vi,
            jlpt_level: k.jlpt_level
          }
        }
      end

      def serialize_grammar(g)
        return nil unless g
        {
          grammar_point: {
            id:             g.id,
            pattern:        g.pattern,
            explanation_vi: g.explanation_vi,
            jlpt_level:     g.jlpt_level
          }
        }
      end
    end
  end
end
