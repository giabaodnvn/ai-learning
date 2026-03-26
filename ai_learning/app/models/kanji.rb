class Kanji < ApplicationRecord
  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze

  after_initialize do
    self.onyomi        ||= []
    self.kunyomi       ||= []
    self.vocab_examples ||= []
  end

  validates :character,  presence: true, uniqueness: true
  validates :meaning_vi, presence: true
  validates :jlpt_level, presence: true, inclusion: { in: JLPT_LEVELS }

  scope :by_level, ->(level) { where(jlpt_level: level) }
end
