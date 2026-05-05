# frozen_string_literal: true

class ListeningAttempt < ApplicationRecord
  belongs_to :user
  belongs_to :listening_exercise

  validates :score, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_questions, presence: true, numericality: { greater_than: 0 }
  validates :speech_rate, presence: true, numericality: { greater_than_or_equal_to: 0.5, less_than_or_equal_to: 2.0 }
end
