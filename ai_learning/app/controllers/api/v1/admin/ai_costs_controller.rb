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

          by_feature = AiUsageLog.aggregate_by_feature(from: from)
          daily      = AiUsageLog.daily_breakdown(from: from)
          totals     = AiUsageLog.totals_from(by_feature)

          render json: {
            range:      range,
            from:       from.to_date.to_s,
            by_feature: by_feature,
            daily:      daily,
            totals:     totals
          }
        end

      end
    end
  end
end
