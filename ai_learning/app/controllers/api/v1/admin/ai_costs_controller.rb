# frozen_string_literal: true

module Api
  module V1
    module Admin
      # GET /api/v1/admin/ai_costs?range=week|month
      # Returns daily/weekly token usage grouped by feature and model,
      # plus estimated cost in USD.
      #
      # The superclass is spelled out: `Admin::BaseController` inside this module
      # resolves to the intended class only by lexical-scope luck, and a
      # top-level `Admin::BaseController` (the HTML panel's) also exists.
      class AiCostsController < Api::V1::Admin::BaseController
        def index
          render json: AiCostReport.new(range: params[:range])
        end
      end
    end
  end
end
