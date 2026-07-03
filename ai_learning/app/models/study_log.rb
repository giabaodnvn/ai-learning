# frozen_string_literal: true

class StudyLog < ApplicationRecord
  belongs_to :user

  validates :studied_on,     presence: true
  validates :cards_reviewed, numericality: { greater_than_or_equal_to: 0 }
  validates :correct_count,  numericality: { greater_than_or_equal_to: 0 }

  # Upsert a daily review event for the user.
  # Race-safe: create_or_find_by! relies on the unique index (user_id, studied_on)
  # so concurrent first-of-day requests can't create duplicate rows.
  def self.record!(user_id:, correct:)
    today = Date.current
    log   = create_or_find_by!(user_id: user_id, studied_on: today) do |l|
      l.cards_reviewed = 0
      l.correct_count  = 0
    end
    log.with_lock do
      log.increment!(:cards_reviewed)
      log.increment!(:correct_count) if correct
    end
    log
  end
end
