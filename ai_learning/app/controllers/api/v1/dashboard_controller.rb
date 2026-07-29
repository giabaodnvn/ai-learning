# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController
      # GET /api/v1/dashboard
      def index
        render json: DashboardStatsService.new(current_user).call
      end

      # GET /api/v1/dashboard/weekly_report
      def weekly_report
        user = current_user

        if user.latest_weekly_report.blank?
          render json: { report: nil, generated_at: nil }
        else
          render json: {
            report:       user.latest_weekly_report,
            generated_at: user.weekly_report_generated_at
          }
        end
      end
    end
  end
end
