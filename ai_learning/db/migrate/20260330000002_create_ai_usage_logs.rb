class CreateAiUsageLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :ai_usage_logs do |t|
      t.bigint  :user_id                           # nullable — system jobs have no user
      t.string  :feature,       null: false        # e.g. "grammar_exercise", "weekly_report"
      t.string  :model,         null: false        # e.g. "gemini-2.5-flash"
      t.integer :input_tokens,  null: false, default: 0
      t.integer :output_tokens, null: false, default: 0
      t.boolean :cached,        null: false, default: false
      t.datetime :created_at,   null: false
    end

    add_index :ai_usage_logs, :user_id
    add_index :ai_usage_logs, :feature
    add_index :ai_usage_logs, :created_at
    add_index :ai_usage_logs, [:feature, :created_at], name: "idx_ai_logs_feature_date"
  end
end
