class CreateUserVocabularyProgresses < ActiveRecord::Migration[7.2]
  def change
    create_table :user_vocabulary_progresses do |t|
      t.references :user,       null: false, foreign_key: true
      t.references :vocabulary, null: false, foreign_key: true
      t.integer    :interval,      null: false, default: 1
      t.decimal    :ease_factor,   null: false, default: "2.5", precision: 4, scale: 2
      t.integer    :repetitions,   null: false, default: 0
      t.date       :due_date,      null: false
      t.datetime   :last_reviewed_at

      t.timestamps
    end

    add_index :user_vocabulary_progresses, [ :user_id, :due_date ]
    add_index :user_vocabulary_progresses, [ :user_id, :vocabulary_id ], unique: true,
              name: "index_uvp_on_user_id_and_vocabulary_id"
  end
end
