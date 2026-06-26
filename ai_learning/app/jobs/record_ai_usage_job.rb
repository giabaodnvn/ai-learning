# frozen_string_literal: true

# Persists a single AI API usage record off the request cycle.
# Enqueued by AiUsageLog.record_async so it never blocks the request and is
# retried on transient DB errors (vs. the old fire-and-forget Thread.new).
class RecordAiUsageJob
  include Sidekiq::Worker

  sidekiq_options retry: 3, queue: "default"

  # `attrs` arrives JSON-serialized from Sidekiq, so keys are strings.
  def perform(attrs)
    AiUsageLog.create!(
      user_id:       attrs["user_id"],
      feature:       attrs["feature"],
      model:         attrs["model"],
      input_tokens:  attrs["input_tokens"],
      output_tokens: attrs["output_tokens"],
      cached:        attrs["cached"] || false,
      created_at:    attrs["created_at"].presence || Time.current
    )
  end
end
