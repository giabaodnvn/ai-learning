# frozen_string_literal: true

class GrammarPointSerializer
  include JSONAPI::Serializer

  attributes :pattern, :explanation_vi, :jlpt_level, :notes_vi, :created_at

  attribute(:examples) { |gp| JsonColumn.parse(gp.examples) }
end
