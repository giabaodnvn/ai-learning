# frozen_string_literal: true

# Builds the dashboard payload for a user: streak, card counts, weekly accuracy,
# per-level JLPT progress and the 365-day activity heatmap.
#
# Extracted from DashboardController#index, which had grown into a 70-line
# action mixing eight queries with the shape of the JSON response.
class DashboardStatsService
  HEATMAP_DAYS   = 365
  ACCURACY_DAYS  = 7

  def initialize(user, today: Date.current)
    @user  = user
    @today = today
  end

  def call
    {
      streak_count:     user.streak_count,
      studied_today:    studied_today?,
      vocab_learned:    user.user_card_progresses.learned.count,
      vocab_due_today:  user.user_card_progresses.where("due_date <= ?", today).count,
      accuracy_7days:   accuracy_7days,
      jlpt_progress:    jlpt_progress,
      activity_heatmap: activity_heatmap
    }
  end

  private

  attr_reader :user, :today

  def studied_today?
    StudyLog.where(user_id: user.id, studied_on: today).exists?
  end

  def accuracy_7days
    logs     = StudyLog.where(user_id: user.id, studied_on: (today - ACCURACY_DAYS)..today)
    reviewed = logs.sum(:cards_reviewed)
    return nil unless reviewed > 0

    (logs.sum(:correct_count).to_f / reviewed * 100).round(1)
  end

  # Learned cards vs. all available cards, per JLPT level.
  def jlpt_progress
    learned = user.user_card_progresses.learned.group(:jlpt_level).count
    totals  = available_cards_by_level

    User::JLPT_LEVELS.index_with do |level|
      total = totals[level]
      done  = learned[level] || 0
      {
        total:   total,
        learned: done,
        percent: total > 0 ? (done.to_f / total * 100).round(1) : 0
      }
    end
  end

  def available_cards_by_level
    counts = [ Vocabulary, Kanji, GrammarPoint ].map { |model| model.group(:jlpt_level).count }

    User::JLPT_LEVELS.index_with { |level| counts.sum { |by_level| by_level.fetch(level, 0) } }
  end

  # One entry per day for the last year, so the client can render a fixed grid.
  # StudyLog is the richer source; card reviews fill days that predate it.
  def activity_heatmap
    from = today - (HEATMAP_DAYS - 1)

    review_counts = user.user_card_progresses
                        .where("last_reviewed_at >= ?", from.beginning_of_day)
                        .group("DATE(last_reviewed_at)")
                        .count
    log_counts    = StudyLog.where(user_id: user.id, studied_on: from..today)
                            .pluck(:studied_on, :cards_reviewed)
                            .to_h

    (from..today).map do |date|
      { date: date.to_s, count: log_counts[date] || review_counts[date] || 0 }
    end
  end
end
