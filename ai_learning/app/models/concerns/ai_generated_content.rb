# frozen_string_literal: true

# Shared behaviour for the two content types the app generates on demand and
# then keeps: reading passages and listening exercises. Both are keyed by
# (jlpt_level, topic), both are listed newest-first, and both models carried
# their own identical `ai_generated` / `by_topic` scopes.
module AiGeneratedContent
  extend ActiveSupport::Concern

  # How many items a listing screen shows before the user filters further.
  PAGE_SIZE = 12

  included do
    # `recent_for` calls `by_level`, so the level behaviour is a hard dependency
    # rather than something the including model has to remember to add.
    include JlptLeveled

    scope :ai_generated, -> { where(ai_generated: true) }
    scope :by_topic,     ->(topic) { where(topic: topic) if topic.present? }

    # The listing query behind both index actions: the most recent generated
    # items at a level, optionally narrowed to one topic.
    scope :recent_for, ->(level, topic = nil, limit: PAGE_SIZE) {
      ai_generated.by_level(level).by_topic(topic).order(created_at: :desc).limit(limit)
    }
  end
end
