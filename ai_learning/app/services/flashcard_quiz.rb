# frozen_string_literal: true

# Builds multiple-choice questions from a set of cards: the card's short answer
# plus three distractors drawn at random from the same content table.
#
# `correct` (the index of the right option) is returned to the client on
# purpose — this is a self-study quiz that grades itself in the browser.
class FlashcardQuiz
  OPTION_COUNT    = 4
  DISTRACTOR_POOL = 6   # over-fetch, then drop blanks/duplicates
  PLACEHOLDER     = "—"

  # `requests` is an enumerable of objects responding to [:card_type]/[:card_id]
  # (ActionController::Parameters or plain hashes). Unknown types and missing
  # records are skipped rather than failing the whole batch.
  def initialize(requests)
    @requests = requests
  end

  def call
    @requests.filter_map do |request|
      card_type = request[:card_type].to_s
      card_id   = request[:card_id].to_i
      next unless CardCatalog::TYPES.include?(card_type)

      card = CardCatalog.model_for(card_type).find_by(id: card_id)
      next unless card

      question_for(card_type, card)
    end
  end

  private

  def question_for(card_type, card)
    answer  = short_answer(card_type, card)
    options = ([ answer ] + distractors(card_type, card, answer)).shuffle

    {
      card_type:     card_type,
      card_id:       card.id,
      question:      prompt(card_type, card),
      question_hint: hint(card_type, card),
      options:       options,
      correct:       options.index(answer)
    }
  end

  def distractors(card_type, card, answer)
    pool  = CardCatalog.model_for(card_type).where.not(id: card.id)
    wrong = CardCatalog.in_random_order(pool)
                       .limit(DISTRACTOR_POOL)
                       .map { |other| short_answer(card_type, other) }
                       .reject { |text| text.blank? || text == answer }
                       .uniq
                       .first(OPTION_COUNT - 1)

    # A level with too few cards can't fill four options; pad so the client
    # always renders a fixed-size grid.
    wrong + [ PLACEHOLDER ] * (OPTION_COUNT - 1 - wrong.size)
  end

  # The correct option: short enough to sit on a button.
  def short_answer(card_type, card)
    case card_type
    when "vocabulary", "kanji" then card.meaning_vi.to_s.split(/[,、]/).first
    when "grammar_point"       then card.explanation_vi.to_s.truncate(60)
    end.to_s.strip
  end

  # Front of the quiz card.
  def prompt(card_type, card)
    case card_type
    when "vocabulary"    then card.word
    when "kanji"         then card.character
    when "grammar_point" then card.pattern
    end
  end

  # Small hint under the prompt.
  def hint(card_type, card)
    case card_type
    when "vocabulary" then card.reading
    when "kanji"
      onyomi = JsonColumn.parse(card.onyomi).first
      "#{card.stroke_count} nét#{onyomi ? " · #{onyomi}" : ""}"
    end
  end
end
