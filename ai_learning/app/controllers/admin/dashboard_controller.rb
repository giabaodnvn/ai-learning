# frozen_string_literal: true

module Admin
  class DashboardController < Admin::BaseController
    def index
      @stats = {
        total_users:    User.count,
        admin_users:    User.where(role: :admin).count,
        active_today:   StudyLog.where(studied_on: Date.current).distinct.count(:user_id),
        active_week:    StudyLog.where(studied_on: 7.days.ago.to_date..).distinct.count(:user_id),
        vip_users:      User.where("vip_level > 0").count,
        blocked_users:  User.where(blocked: true).count
      }

      today  = AiUsageLog.aggregate_by_feature(from: Date.current.beginning_of_day)
      totals = AiUsageLog.totals_from(today)
      @ai_stats = {
        requests_today: totals[:requests],
        tokens_today:   totals[:input_tokens] + totals[:output_tokens],
        cost_today:     totals[:cost_usd].round(4)
      }

      @recent_users = User.order(created_at: :desc).limit(8)

      @daily_signups = User
        .where("created_at >= ?", 14.days.ago)
        .group("DATE(created_at)")
        .count
        .transform_keys(&:to_s)
    end
  end
end
