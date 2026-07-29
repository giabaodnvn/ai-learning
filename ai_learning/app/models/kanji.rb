class Kanji < ApplicationRecord
  include JlptLeveled

  after_initialize do
    self.onyomi        ||= []
    self.kunyomi       ||= []
    self.vocab_examples ||= []
  end

  validates :character,  presence: true, uniqueness: true
  validates :meaning_vi, presence: true
end
