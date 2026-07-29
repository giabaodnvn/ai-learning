# frozen_string_literal: true

class ListeningExercise < ApplicationRecord
  include AiGeneratedContent

  has_many :listening_attempts, dependent: :destroy

  validates :topic, presence: true
  validates :title, presence: true
  validates :script_ja, presence: true
  validates :script_vi, presence: true
  validates :questions, presence: true
end
