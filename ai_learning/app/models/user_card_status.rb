# frozen_string_literal: true

# Tracks whether a user has "learned" a card (independent of SRS scheduling).
# Updated by the quiz: correct answer → learned: true, wrong → learned: false.
class UserCardStatus < ApplicationRecord
  belongs_to :user

  CARD_TYPES = %w[vocabulary kanji grammar_point].freeze

  validates :card_type,  presence: true, inclusion: { in: CARD_TYPES }
  validates :card_id,    presence: true
  validates :jlpt_level, presence: true
  validates :learned,    inclusion: { in: [true, false] }

  scope :learned,     -> { where(learned: true) }
  scope :not_learned, -> { where(learned: false) }
  scope :for_type,    ->(t) { where(card_type: t) }
  scope :for_level,   ->(l) { where(jlpt_level: l) }
end
