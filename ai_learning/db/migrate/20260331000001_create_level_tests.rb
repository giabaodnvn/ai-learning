class CreateLevelTests < ActiveRecord::Migration[7.2]
  def change
    create_table :level_tests do |t|
      t.string  :jlpt_level,      null: false              # n5 / n4 / n3 / n2 / n1
      t.string  :title,           null: false
      t.json    :sections,        null: false              # [{name, name_vi, passage?, questions:[]}]
      t.integer :total_questions, null: false, default: 25
      t.integer :pass_score,      null: false, default: 18 # correct answers needed to pass
      t.integer :time_limit_min,  null: false, default: 30 # minutes
      t.boolean :ai_generated,    null: false, default: true
      t.timestamps
    end

    add_index :level_tests, :jlpt_level
    add_index :level_tests, :created_at
  end
end
