class AddPerformanceIndexes < ActiveRecord::Migration[7.2]
  def change
    # user_card_progresses: dashboard query "where(learned: true).count" needs (user_id, learned)
    unless index_exists?(:user_card_progresses, [:user_id, :learned])
      add_index :user_card_progresses, [:user_id, :learned],
                name: "idx_ucp_user_learned"
    end

    # user_card_progresses: jlpt_progress query groups by jlpt_level for learned cards
    unless index_exists?(:user_card_progresses, [:user_id, :learned, :jlpt_level])
      add_index :user_card_progresses, [:user_id, :learned, :jlpt_level],
                name: "idx_ucp_user_learned_level"
    end

    # study_logs: standalone user_id for joins in WeeklyReportJob
    unless index_exists?(:study_logs, :user_id)
      add_index :study_logs, :user_id, name: "idx_study_logs_user_id"
    end

    # vocabularies: (jlpt_level, word) for seeder idempotency and filtered lookups
    unless index_exists?(:vocabularies, [:jlpt_level, :word])
      add_index :vocabularies, [:jlpt_level, :word],
                name: "idx_vocabularies_level_word"
    end
  end
end
