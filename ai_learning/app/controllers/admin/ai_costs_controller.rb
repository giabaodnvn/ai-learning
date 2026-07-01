# frozen_string_literal: true

module Admin
  class AiCostsController < Admin::BaseController
    def index
      @range = params[:range].presence || "week"
      from   = @range == "month" ? 30.days.ago : 7.days.ago

      @by_feature = AiUsageLog.aggregate_by_feature(from: from)
      @daily      = AiUsageLog.daily_breakdown(from: from)
      @totals     = AiUsageLog.totals_from(@by_feature)
    end
  end
end
