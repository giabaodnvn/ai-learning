# frozen_string_literal: true

module Admin
  class AiCostsController < Admin::BaseController
    def index
      @range = params[:range].presence || "week"
      from   = @range == "month" ? 30.days.ago : 7.days.ago

      @by_feature = AiUsageLog
        .where("created_at >= ?", from)
        .group(:feature, :model)
        .select(
          "feature, model",
          "SUM(input_tokens)  AS total_input",
          "SUM(output_tokens) AS total_output",
          "COUNT(*)           AS requests",
          "SUM(cached = 1)    AS cached_hits"
        )
        .map do |r|
          cost = estimate_cost(r.model, r.total_input.to_i, r.total_output.to_i)
          { feature: r.feature, model: r.model, requests: r.requests.to_i,
            cached_hits: r.cached_hits.to_i, input: r.total_input.to_i,
            output: r.total_output.to_i, cost: cost }
        end
        .sort_by { |r| -r[:cost] }

      @daily = AiUsageLog
        .where("created_at >= ?", from)
        .group("DATE(created_at)")
        .select("DATE(created_at) AS day, SUM(input_tokens + output_tokens) AS tokens, COUNT(*) AS requests")
        .map { |r| { date: r.day.to_s, tokens: r.tokens.to_i, requests: r.requests.to_i } }
        .sort_by { |r| r[:date] }

      @totals = @by_feature.each_with_object({ requests: 0, input: 0, output: 0, cost: 0.0 }) do |r, h|
        h[:requests] += r[:requests]; h[:input] += r[:input]
        h[:output]   += r[:output];   h[:cost]  += r[:cost]
      end
    end

    private

    PRICING = AiUsageLog::COST_PER_1K
    DEFAULT  = AiUsageLog::DEFAULT_COST

    def estimate_cost(model, input, output)
      p = PRICING.find { |k, _| model.to_s.include?(k) }&.last || DEFAULT
      ((input / 1000.0 * p[:input]) + (output / 1000.0 * p[:output])).round(6)
    end
  end
end
