# frozen_string_literal: true

class AddIndexToAiUsageLogsCreatedAt < ActiveRecord::Migration[7.2]
  def change
    add_index :ai_usage_logs, :created_at
  end
end
