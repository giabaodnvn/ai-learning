# frozen_string_literal: true

class CreateListeningAttempts < ActiveRecord::Migration[7.2]
  def change
    create_table :listening_attempts do |t|
      t.references :user,               null: false, foreign_key: true
      t.references :listening_exercise, null: false, foreign_key: true
      t.integer    :score,              null: false
      t.integer    :total_questions,    null: false
      t.float      :speech_rate,        null: false, default: 1.0

      t.timestamps
    end

    add_index :listening_attempts, [:user_id, :created_at]
  end
end
