# frozen_string_literal: true

module Admin
  class AiCostsController < Admin::BaseController
    def index
      report = AiCostReport.new(range: params[:range])

      @range      = report.range
      @by_feature = report.by_feature
      @daily      = report.daily
      @totals     = report.totals
    end
  end
end
