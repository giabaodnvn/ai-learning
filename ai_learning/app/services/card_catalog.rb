# frozen_string_literal: true

# Maps the polymorphic `card_type` used by UserCardProgress
# ("vocabulary" | "kanji" | "grammar_point") onto its backing model and its
# JSON content fields.
#
# The flashcard and SRS-review endpoints both need the same three lookups —
# which model backs a type, how to batch-load the records behind a set of
# progress rows without N+1 queries, and how to render a card's content — and
# each used to carry its own copy of the case statements.
module CardCatalog
  # Model names are stored as strings so the constant does not force the models
  # to load when this file does (and so code reloading in development works).
  MODELS = {
    "vocabulary"    => "Vocabulary",
    "kanji"         => "Kanji",
    "grammar_point" => "GrammarPoint"
  }.freeze

  TYPES = MODELS.keys.freeze

  # MySQL random ordering, built through Arel's function node rather than a raw
  # SQL string. Declared once here instead of being repeated at every call site,
  # so there is a single place to change if the app moves off MySQL.
  def self.random_order
    Arel::Nodes::NamedFunction.new("RAND", [])
  end

  # `scope` in random order — used to draw practice cards and quiz distractors.
  def self.in_random_order(scope)
    scope.order(random_order)
  end

  # Returns the ActiveRecord class for a card type, or nil for an unknown type.
  def self.model_for(type)
    MODELS[type.to_s]&.constantize
  end

  # Batch-load the content records behind a set of UserCardProgress rows.
  # Returns a lookup keyed "#{card_type}:#{card_id}".
  def self.batch_load(progresses)
    progresses.group_by(&:card_type).each_with_object({}) do |(type, rows), result|
      model = model_for(type)
      next unless model

      model.where(id: rows.map(&:card_id)).each do |record|
        result["#{type}:#{record.id}"] = record
      end
    end
  end

  # Compact projection used by the SRS review screen, which nests the content
  # under a key named after the card type. Deliberately leaner than
  # `attributes_for` (one joined reading instead of the full onyomi/kunyomi
  # arrays); kept next to it so the two shapes can't drift unnoticed.
  def self.summary_for(type, card)
    case type.to_s
    when "vocabulary"
      {
        id:             card.id,
        word:           card.word,
        reading:        card.reading,
        meaning_vi:     card.meaning_vi,
        part_of_speech: card.part_of_speech,
        jlpt_level:     card.jlpt_level
      }
    when "kanji"
      {
        id:         card.id,
        character:  card.character,
        reading_on: JsonColumn.parse(card.onyomi).join("、"),
        meaning_vi: card.meaning_vi,
        jlpt_level: card.jlpt_level
      }
    when "grammar_point"
      {
        id:             card.id,
        pattern:        card.pattern,
        explanation_vi: card.explanation_vi,
        jlpt_level:     card.jlpt_level
      }
    end
  end

  # Content fields for a card, keyed the way the flashcard endpoints expose them.
  def self.attributes_for(type, card)
    case type.to_s
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
        onyomi:         JsonColumn.parse(card.onyomi),
        kunyomi:        JsonColumn.parse(card.kunyomi),
        meaning_vi:     card.meaning_vi,
        stroke_count:   card.stroke_count,
        vocab_examples: JsonColumn.parse(card.vocab_examples)
      }
    when "grammar_point"
      {
        pattern:        card.pattern,
        explanation_vi: card.explanation_vi,
        examples:       JsonColumn.parse(card.examples),
        notes_vi:       card.notes_vi
      }
    end
  end
end
