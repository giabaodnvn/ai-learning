class Vocabulary < ApplicationRecord
  include JlptLeveled

  PARTS_OF_SPEECH = %w[noun verb adjective adverb particle expression other].freeze

  after_initialize { self.tags ||= [] }

  validates :word,           presence: true, uniqueness: { scope: :jlpt_level }
  validates :reading,        presence: true
  validates :meaning_vi,     presence: true
  validates :part_of_speech, inclusion: { in: PARTS_OF_SPEECH }, allow_nil: true
end
