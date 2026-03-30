# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController

      # GET /api/v1/dashboard
      def index
        user  = current_user
        today = Date.current

        # ── Streak & today ──────────────────────────────────────────────────
        studied_today = StudyLog.where(user_id: user.id, studied_on: today).exists?

        # ── Card stats ──────────────────────────────────────────────────────
        vocab_learned    = user.user_card_progresses.where(learned: true).count
        vocab_due_today  = user.user_card_progresses.where("due_date <= ?", today).count

        # ── 7-day accuracy (from study_logs) ────────────────────────────────
        week_logs      = StudyLog.where(user_id: user.id, studied_on: 7.days.ago.to_date..today)
        total_reviewed = week_logs.sum(:cards_reviewed)
        total_correct  = week_logs.sum(:correct_count)
        accuracy_7days = total_reviewed > 0 ? (total_correct.to_f / total_reviewed * 100).round(1) : nil

        # ── JLPT progress (learned cards per level) ──────────────────────────
        # Total available cards per level across all types
        level_totals  = {}
        level_learned = user.user_card_progresses
                            .where(learned: true)
                            .group(:jlpt_level)
                            .count

        User::JLPT_LEVELS.each do |lvl|
          total_vocab   = Vocabulary.where(jlpt_level: lvl).count
          total_kanji   = Kanji.where(jlpt_level: lvl).count
          total_grammar = GrammarPoint.where(jlpt_level: lvl).count
          level_totals[lvl] = total_vocab + total_kanji + total_grammar
        end

        jlpt_progress = User::JLPT_LEVELS.each_with_object({}) do |lvl, h|
          total   = level_totals[lvl]
          learned = level_learned[lvl] || 0
          h[lvl]  = {
            total:    total,
            learned:  learned,
            percent:  total > 0 ? (learned.to_f / total * 100).round(1) : 0
          }
        end

        # ── Activity heatmap (last 365 days from card reviews) ───────────────
        from = 364.days.ago.to_date
        raw_counts = user.user_card_progresses
                         .where("last_reviewed_at >= ?", from.beginning_of_day)
                         .group("DATE(last_reviewed_at)")
                         .count
        # Merge with study_log review counts for richer data
        log_counts = StudyLog.where(user_id: user.id, studied_on: from..today)
                             .pluck(:studied_on, :cards_reviewed)
                             .to_h

        activity_heatmap = (from..today).map do |date|
          count = log_counts[date] || raw_counts[date] || 0
          { date: date.to_s, count: count }
        end

        render json: {
          streak_count:    user.streak_count,
          studied_today:   studied_today,
          vocab_learned:   vocab_learned,
          vocab_due_today: vocab_due_today,
          accuracy_7days:  accuracy_7days,
          jlpt_progress:   jlpt_progress,
          activity_heatmap: activity_heatmap
        }
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
