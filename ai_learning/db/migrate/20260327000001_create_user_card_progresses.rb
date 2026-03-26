class CreateUserCardProgresses < ActiveRecord::Migration[7.2]
  def change
    create_table :user_card_progresses do |t|
      t.references :user,        null: false, foreign_key: true
      t.string     :card_type,   null: false   # vocabulary | kanji | grammar_point
      t.bigint     :card_id,     null: false
      t.string     :jlpt_level,  null: false   # denormalized for efficient level filtering
      t.integer    :interval,    null: false, default: 1
      t.decimal    :ease_factor, null: false, default: "2.5", precision: 4, scale: 2
      t.integer    :repetitions, null: false, default: 0
      t.date       :due_date,    null: false
      t.datetime   :last_reviewed_at
      t.timestamps
    end

    add_index :user_card_progresses, [:user_id, :card_type, :card_id],
              unique: true, name: "uq_user_card"
    add_index :user_card_progresses, [:user_id, :due_date],
              name: "idx_user_due"
    add_index :user_card_progresses, [:user_id, :card_type, :jlpt_level],
              name: "idx_user_type_level"
  end
end
