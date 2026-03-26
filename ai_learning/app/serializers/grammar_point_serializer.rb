# frozen_string_literal: true

class GrammarPointSerializer
  include JSONAPI::Serializer

  attributes :pattern, :explanation_vi, :jlpt_level, :notes_vi, :created_at

  attribute :examples do |gp|
    ex = gp.examples
    ex.is_a?(String) ? JSON.parse(ex) : Array(ex)
  rescue JSON::ParseError
    []
  end
end
