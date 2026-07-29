# frozen_string_literal: true

class KanjiSerializer
  include JSONAPI::Serializer

  attributes :character, :meaning_vi, :jlpt_level, :stroke_count, :created_at

  attribute(:onyomi)         { |kanji| JsonColumn.parse(kanji.onyomi) }
  attribute(:kunyomi)        { |kanji| JsonColumn.parse(kanji.kunyomi) }
  attribute(:vocab_examples) { |kanji| JsonColumn.parse(kanji.vocab_examples) }
end
