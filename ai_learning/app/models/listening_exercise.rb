# frozen_string_literal: true

class ListeningExercise < ApplicationRecord
  has_many :listening_attempts, dependent: :destroy

  validates :jlpt_level, presence: true, inclusion: { in: %w[n5 n4 n3 n2 n1] }
  validates :topic, presence: true
  validates :title, presence: true
  validates :script_ja, presence: true
  validates :script_vi, presence: true
  validates :questions, presence: true

  scope :by_level, ->(level) { where(jlpt_level: level) if level.present? }
  scope :by_topic, ->(topic) { where(topic: topic) if topic.present? }
  scope :ai_generated, -> { where(ai_generated: true) }
end
