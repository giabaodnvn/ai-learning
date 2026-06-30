# frozen_string_literal: true

# Stores per-request AI API usage for cost tracking and auditing.
# Written asynchronously via AiUsageLog.record_async (enqueues RecordAiUsageJob)
# so it never blocks requests.
class AiUsageLog < ApplicationRecord
  self.ignored_columns += [] # no timestamps column (created_at only)

  belongs_to :user, optional: true

  validates :feature,       presence: true
  validates :model,         presence: true
  validates :input_tokens,  numericality: { greater_than_or_equal_to: 0 }
  validates :output_tokens, numericality: { greater_than_or_equal_to: 0 }

  # Pricing per 1 000 tokens (approximate, update as needed)
  COST_PER_1K = {
    "gemini-2.5-flash"   => { input: 0.000_1,  output: 0.000_4  },
    "gemini-1.5-flash"   => { input: 0.000_075, output: 0.000_3  },
    # Keep Claude names for forward-compat if model is switched back
    "claude-haiku"       => { input: 0.000_8,  output: 0.004    },
    "claude-sonnet"      => { input: 0.015,    output: 0.075    }
  }.freeze

  DEFAULT_COST = { input: 0.000_1, output: 0.000_4 }.freeze

  # Non-blocking write: enqueue a Sidekiq job (persistent + retried) instead of
  # spawning an unbounded thread. Capture the timestamp now so the record
  # reflects when the AI call happened, not when the job runs.
  def self.record_async(feature:, model:, input_tokens:, output_tokens:, user_id: nil, cached: false)
    RecordAiUsageJob.perform_async(
      "feature"       => feature,
      "model"         => model,
      "input_tokens"  => input_tokens,
      "output_tokens" => output_tokens,
      "user_id"       => user_id,
      "cached"        => cached,
      "created_at"    => Time.current.iso8601
    )
  rescue => e
    # Logging must never break the request path (e.g. Redis unavailable).
    Rails.logger.warn "[AiUsageLog] enqueue failed: #{e.message}"
  end

  # Estimated cost in USD for a given model name + token counts.
  def self.cost_for(model:, input_tokens:, output_tokens:)
    pricing = COST_PER_1K.find { |k, _| model.to_s.include?(k) }&.last || DEFAULT_COST
    (input_tokens  / 1000.0 * pricing[:input]) +
    (output_tokens / 1000.0 * pricing[:output])
  end

  # Returns estimated cost in USD for a record's token counts.
  def estimated_cost
    self.class.cost_for(model: model, input_tokens: input_tokens, output_tokens: output_tokens)
  end
end
