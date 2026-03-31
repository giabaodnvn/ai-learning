# frozen_string_literal: true

module Api
  module V1
    module Admin
      # GET /api/v1/admin/ai_costs?range=week|month
      # Returns daily/weekly token usage grouped by feature and model,
      # plus estimated cost in USD.
      class AiCostsController < Admin::BaseController
        def index
          range = params[:range].presence || "week"
          from  = range == "month" ? 30.days.ago : 7.days.ago

          # Raw aggregation by feature + model
          rows = AiUsageLog
            .where("created_at >= ?", from)
            .group(:feature, :model)
            .select(
              "feature",
              "model",
              "SUM(input_tokens)  AS total_input",
              "SUM(output_tokens) AS total_output",
              "COUNT(*)           AS requests",
              "SUM(cached = 1)    AS cached_hits"
            )

          by_feature = rows.map do |r|
            cost = estimate_cost(r.model, r.total_input.to_i, r.total_output.to_i)
            {
              feature:      r.feature,
              model:        r.model,
              requests:     r.requests.to_i,
              cached_hits:  r.cached_hits.to_i,
              input_tokens: r.total_input.to_i,
              output_tokens: r.total_output.to_i,
              estimated_cost_usd: cost.round(6)
            }
          end

          # Daily breakdown (last 30 days max)
          daily = AiUsageLog
            .where("created_at >= ?", from)
            .group("DATE(created_at)")
            .select(
              "DATE(created_at) AS day",
              "SUM(input_tokens + output_tokens) AS total_tokens",
              "COUNT(*) AS requests"
            )
            .map { |r| { date: r.day.to_s, total_tokens: r.total_tokens.to_i, requests: r.requests.to_i } }

          totals = by_feature.each_with_object({ requests: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0.0 }) do |r, h|
            h[:requests]      += r[:requests]
            h[:input_tokens]  += r[:input_tokens]
            h[:output_tokens] += r[:output_tokens]
            h[:cost_usd]      += r[:estimated_cost_usd]
          end
          totals[:cost_usd] = totals[:cost_usd].round(6)

          render json: {
            range:       range,
            from:        from.to_date.to_s,
            by_feature:  by_feature,
            daily:       daily,
            totals:      totals
          }
        end

        private

        PRICING = AiUsageLog::COST_PER_1K
        DEFAULT  = AiUsageLog::DEFAULT_COST

        def estimate_cost(model, input_tokens, output_tokens)
          pricing = PRICING.find { |k, _| model.to_s.include?(k) }&.last || DEFAULT
          (input_tokens  / 1000.0 * pricing[:input]) +
          (output_tokens / 1000.0 * pricing[:output])
        end
      end
    end
  end
end
