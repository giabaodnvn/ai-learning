# frozen_string_literal: true

# Sidekiq-Cron scheduled jobs.
# Requires the `sidekiq-cron` gem.
# All times in UTC; the app runs in Asia/Tokyo (JST = UTC+9).

Sidekiq.configure_server do |_config|
  Sidekiq::Cron::Job.load_from_hash(
    "daily_streak_job" => {
      "cron"  => "0 15 * * *",  # 00:00 JST (15:00 UTC)
      "class" => "DailyStreakJob",
      "queue" => "default"
    },
    "weekly_report_job" => {
      "cron"  => "0 11 * * 0",  # Sunday 20:00 JST (11:00 UTC)
      "class" => "WeeklyReportJob",
      "queue" => "default"
    }
  )
end
