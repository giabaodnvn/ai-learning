class CreateConversationSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :conversation_sessions do |t|
      t.references :user,       null: false, foreign_key: true
      t.string     :role,       null: false
      t.string     :jlpt_level, null: false
      t.json       :messages

      t.timestamps
    end

    add_index :conversation_sessions, :jlpt_level
    add_index :conversation_sessions, [ :user_id, :created_at ]
  end
end
