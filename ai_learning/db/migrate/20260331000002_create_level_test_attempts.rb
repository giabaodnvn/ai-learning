class CreateLevelTestAttempts < ActiveRecord::Migration[7.2]
  def change
    create_table :level_test_attempts do |t|
      t.bigint  :user_id,         null: false
      t.bigint  :level_test_id,   null: false
      t.json    :answers,         null: false              # [{question_id, section_index, answer_index}]
      t.integer :score,           null: false, default: 0  # correct count
      t.integer :total_questions, null: false, default: 25
      t.boolean :passed,          null: false, default: false
      t.string  :jlpt_level,      null: false              # level of the test taken
      t.string  :level_before,    null: false              # user's level before attempt
      t.string  :level_after                               # null if not passed / already max
      t.datetime :completed_at
      t.timestamps
    end

    add_index :level_test_attempts, :user_id
    add_index :level_test_attempts, :level_test_id
    add_index :level_test_attempts, [:user_id, :jlpt_level]
    add_index :level_test_attempts, :passed
  end
end
