# frozen_string_literal: true

class VocabularySerializer
  include JSONAPI::Serializer

  attributes :word, :reading, :meaning_vi, :part_of_speech, :jlpt_level, :created_at

  attribute(:tags) { |v| JsonColumn.parse(v.tags) }
end
