# frozen_string_literal: true

class LevelTestAttempt < ApplicationRecord
  belongs_to :user
  belongs_to :level_test

  after_initialize { self.answers ||= [] }

  validates :score, :total_questions, numericality: { greater_than_or_equal_to: 0 }

  scope :for_user,  ->(uid)  { where(user_id: uid) }
  scope :passed,             -> { where(passed: true) }
  scope :for_level, ->(lvl)  { where(jlpt_level: lvl) }

  def accuracy
    return 0 if total_questions.zero?
    (score.to_f / total_questions * 100).round(1)
  end
end
