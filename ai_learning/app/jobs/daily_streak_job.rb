# frozen_string_literal: true

# DailyStreakJob — resets streak for users who did not study yesterday.
# Scheduled via sidekiq-cron: daily at 00:00 JST (15:00 UTC).
#
# Manual trigger: DailyStreakJob.perform_async
class DailyStreakJob
  include Sidekiq::Worker

  sidekiq_options retry: 2, queue: "default"

  def perform
    yesterday = Date.current - 1

    # Users who studied yesterday — keep their streak
    studied_ids = StudyLog.where(studied_on: yesterday).pluck(:user_id)

    # Reset streak for everyone else who had streak > 0
    reset_count = User.where.not(id: studied_ids)
                      .where("streak_count > 0")
                      .update_all(streak_count: 0)

    Rails.logger.info "[DailyStreakJob] Reset streak for #{reset_count} users (date: #{yesterday})"
  end
end
