class Vocabulary < ApplicationRecord
  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze
  PARTS_OF_SPEECH = %w[noun verb adjective adverb particle expression other].freeze

  enum :jlpt_level, { n5: "n5", n4: "n4", n3: "n3", n2: "n2", n1: "n1" }

  after_initialize { self.tags ||= [] }

  has_many :user_vocabulary_progresses, dependent: :destroy
  has_many :users, through: :user_vocabulary_progresses

  validates :word,           presence: true
  validates :reading,        presence: true
  validates :meaning_vi,     presence: true
  validates :jlpt_level,     presence: true, inclusion: { in: JLPT_LEVELS }
  validates :part_of_speech, inclusion: { in: PARTS_OF_SPEECH }, allow_nil: true

  scope :by_level, ->(level) { where(jlpt_level: level) }
  scope :by_tag,   ->(tag)   { where("JSON_CONTAINS(tags, ?)", tag.to_json) }
end
