class GrammarPoint < ApplicationRecord
  include JlptLeveled

  after_initialize { self.examples ||= [] }

  validates :pattern,        presence: true, uniqueness: { scope: :jlpt_level }
  validates :explanation_vi, presence: true
end
