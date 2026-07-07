class DropUserVocabularyProgresses < ActiveRecord::Migration[7.2]
  def change
    drop_table :user_vocabulary_progresses do |t|
      t.bigint   :user_id, null: false
      t.bigint   :vocabulary_id, null: false
      t.integer  :interval, default: 1, null: false
      t.decimal  :ease_factor, precision: 4, scale: 2, default: "2.5", null: false
      t.integer  :repetitions, default: 0, null: false
      t.date     :due_date, null: false
      t.datetime :last_reviewed_at
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
      t.index [ :user_id, :due_date ], name: "index_user_vocabulary_progresses_on_user_id_and_due_date"
      t.index [ :user_id, :vocabulary_id ], name: "index_uvp_on_user_id_and_vocabulary_id", unique: true
      t.index [ :user_id ], name: "index_user_vocabulary_progresses_on_user_id"
      t.index [ :vocabulary_id ], name: "index_user_vocabulary_progresses_on_vocabulary_id"
    end
  end
end
