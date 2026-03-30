class CreateStudyLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :study_logs do |t|
      t.bigint  :user_id,        null: false
      t.date    :studied_on,     null: false
      t.integer :cards_reviewed, null: false, default: 0
      t.integer :correct_count,  null: false, default: 0
      t.timestamps
    end

    add_index :study_logs, [:user_id, :studied_on], unique: true
    add_index :study_logs, :studied_on
    add_foreign_key :study_logs, :users
  end
end
