# frozen_string_literal: true

class WeeklyReportMailer < ApplicationMailer
  # Send weekly AI progress report to the user.
  # Usage: WeeklyReportMailer.report(user).deliver_later
  def report(user)
    @user   = user
    @report = user.latest_weekly_report

    mail(
      to:      user.email,
      subject: "📊 Báo cáo tiến độ học tiếng Nhật tuần này của bạn"
    )
  end
end
