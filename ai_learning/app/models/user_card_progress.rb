# frozen_string_literal: true

# Universal SRS progress record for any study content type.
# Replaces the vocabulary-only UserVocabularyProgress for the new flashcard system.
#
# card_type: "vocabulary" | "kanji" | "grammar_point"
# jlpt_level is denormalized here so we can filter due cards by level in one query.
class UserCardProgress < ApplicationRecord
  belongs_to :user

  CARD_TYPES  = %w[vocabulary kanji grammar_point].freeze
  NEW_PER_DAY = { "vocabulary" => 10, "kanji" => 10, "grammar_point" => 3 }.freeze

  validates :card_type,   presence: true, inclusion: { in: CARD_TYPES }
  validates :card_id,     presence: true
  validates :jlpt_level,  presence: true
  validates :interval,    presence: true, numericality: { greater_than: 0 }
  validates :ease_factor, presence: true, numericality: { greater_than_or_equal_to: 1.3 }
  validates :repetitions, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :due_date,    presence: true

  scope :due_today,  -> { where("due_date <= ?", Date.current) }
  scope :for_type,   ->(t)     { where(card_type: t) }
  scope :for_level,  ->(level) { where(jlpt_level: level) }
end
