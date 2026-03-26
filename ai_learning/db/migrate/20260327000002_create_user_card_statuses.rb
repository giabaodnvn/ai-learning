class CreateUserCardStatuses < ActiveRecord::Migration[7.2]
  def change
    create_table :user_card_statuses do |t|
      t.references :user,       null: false, foreign_key: true
      t.string     :card_type,  null: false   # vocabulary | kanji | grammar_point
      t.bigint     :card_id,    null: false
      t.string     :jlpt_level, null: false
      t.boolean    :learned,    null: false, default: false
      t.timestamps
    end

    add_index :user_card_statuses, [:user_id, :card_type, :card_id],
              unique: true, name: "uq_user_card_status"
    add_index :user_card_statuses, [:user_id, :jlpt_level, :learned],
              name: "idx_user_level_learned"
  end
end
