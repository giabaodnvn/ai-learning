class GrammarPoint < ApplicationRecord
  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze

  enum :jlpt_level, { n5: "n5", n4: "n4", n3: "n3", n2: "n2", n1: "n1" }

  after_initialize { self.examples ||= [] }

  validates :pattern,        presence: true
  validates :explanation_vi, presence: true
  validates :jlpt_level,     presence: true, inclusion: { in: JLPT_LEVELS }

  scope :by_level, ->(level) { where(jlpt_level: level) }
end
