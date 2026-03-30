# frozen_string_literal: true

# WeeklyReportJob — generates a personalised AI study report for every user.
# Scheduled via sidekiq-cron: every Sunday at 20:00 JST (11:00 UTC).
#
# Manual trigger: WeeklyReportJob.perform_async
# Single user:   WeeklyReportJob.perform_async(user_id)
class WeeklyReportJob
  include Sidekiq::Worker

  sidekiq_options retry: 1, queue: "default"

  def perform(user_id = nil)
    users = user_id ? User.where(id: user_id) : User.all

    users.find_each do |user|
      generate_for(user)
    rescue => e
      Rails.logger.error "[WeeklyReportJob] Failed for user #{user.id}: #{e.message}"
    end
  end

  private

  def generate_for(user)
    today     = Date.current
    week_ago  = today - 7

    # Study log stats
    logs           = StudyLog.where(user_id: user.id, studied_on: week_ago..today)
    total_reviewed = logs.sum(:cards_reviewed)
    total_correct  = logs.sum(:correct_count)
    accuracy       = total_reviewed > 0 ? (total_correct.to_f / total_reviewed * 100).round(1) : 0

    # Conversation sessions this week
    conversation_count = user.conversation_sessions
                             .where("created_at >= ?", week_ago.beginning_of_day)
                             .count

    # Top 5 most struggled cards (lowest ease_factor, only studied ones)
    hard_progresses = user.user_card_progresses
                          .where(card_type: "vocabulary")
                          .where("repetitions > 0")
                          .order(ease_factor: :asc)
                          .limit(5)
    word_ids     = hard_progresses.pluck(:card_id)
    missed_words = Vocabulary.where(id: word_ids).pluck(:word)

    data = {
      total_reviewed:     total_reviewed,
      accuracy:           accuracy,
      conversation_count: conversation_count,
      streak_count:       user.streak_count,
      jlpt_level:         user.jlpt_level,
      missed_words:       missed_words
    }

    prompt = Prompts::WeeklyReportPrompt.build(data: data)
    report = ClaudeService.complete(prompt: prompt, max_tokens: 1024)

    user.update_columns(
      latest_weekly_report:        report,
      weekly_report_generated_at:  Time.current
    )

    WeeklyReportMailer.report(user).deliver_later if user.email.present?

    Rails.logger.info "[WeeklyReportJob] Generated report for user #{user.id}"
  end
end
