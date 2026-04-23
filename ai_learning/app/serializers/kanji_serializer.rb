# frozen_string_literal: true

class KanjiSerializer
  include JSONAPI::Serializer

  attributes :character, :meaning_vi, :jlpt_level, :stroke_count, :created_at

  attribute :onyomi do |kanji|
    onyomi = kanji.onyomi
    onyomi.is_a?(String) ? JSON.parse(onyomi) : Array(onyomi)
  rescue JSON::ParseError
    []
  end

  attribute :kunyomi do |kanji|
    kunyomi = kanji.kunyomi
    kunyomi.is_a?(String) ? JSON.parse(kunyomi) : Array(kunyomi)
  rescue JSON::ParseError
    []
  end

  attribute :vocab_examples do |kanji|
    vocab = kanji.vocab_examples
    vocab.is_a?(String) ? JSON.parse(vocab) : Array(vocab)
  rescue JSON::ParseError
    []
  end
end
