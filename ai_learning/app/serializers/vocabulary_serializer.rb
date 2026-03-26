# frozen_string_literal: true

class VocabularySerializer
  include JSONAPI::Serializer

  attributes :word, :reading, :meaning_vi, :part_of_speech, :jlpt_level, :created_at

  attribute :tags do |v|
    t = v.tags
    t.is_a?(String) ? JSON.parse(t) : Array(t)
  rescue JSON::ParseError
    []
  end
end
