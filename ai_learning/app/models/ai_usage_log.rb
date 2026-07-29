# frozen_string_literal: true

# Stores per-request AI API usage for cost tracking and auditing.
# Written asynchronously via AiUsageLog.record_async (enqueues RecordAiUsageJob)
# so it never blocks requests.
class AiUsageLog < ApplicationRecord
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

  # Aggregated usage grouped by feature + model for a given time window.
  # Returns array sorted by cost descending.
  def self.aggregate_by_feature(from:)
    where("created_at >= ?", from)
      .group(:feature, :model)
      .select(
        "feature", "model",
        "SUM(input_tokens)  AS total_input",
        "SUM(output_tokens) AS total_output",
        "COUNT(*)           AS requests",
        "SUM(cached = 1)    AS cached_hits"
      )
      .map do |r|
        cost = cost_for(model: r.model, input_tokens: r.total_input.to_i, output_tokens: r.total_output.to_i)
        {
          feature:            r.feature,
          model:              r.model,
          requests:           r.requests.to_i,
          cached_hits:        r.cached_hits.to_i,
          input_tokens:       r.total_input.to_i,
          output_tokens:      r.total_output.to_i,
          estimated_cost_usd: cost.round(6)
        }
      end
      .sort_by { |r| -r[:estimated_cost_usd] }
  end

  # Daily token + request breakdown for a given time window, sorted by date.
  def self.daily_breakdown(from:)
    where("created_at >= ?", from)
      .group("DATE(created_at)")
      .select(
        "DATE(created_at) AS day",
        "SUM(input_tokens + output_tokens) AS total_tokens",
        "COUNT(*) AS requests"
      )
      .map { |r| { date: r.day.to_s, total_tokens: r.total_tokens.to_i, requests: r.requests.to_i } }
      .sort_by { |r| r[:date] }
  end

  # Sums requests, tokens, and cost across a by_feature array.
  def self.totals_from(rows)
    rows
      .each_with_object({ requests: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0.0 }) do |r, h|
        h[:requests]      += r[:requests]
        h[:input_tokens]  += r[:input_tokens]
        h[:output_tokens] += r[:output_tokens]
        h[:cost_usd]      += r[:estimated_cost_usd]
      end
      .tap { |h| h[:cost_usd] = h[:cost_usd].round(6) }
  end
end
