# frozen_string_literal: true

class CreateWritingSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :writing_submissions do |t|
      t.references :user, null: false, foreign_key: true
      t.text    :text,     null: false
      t.text    :feedback, null: false
      t.string  :topic

      t.timestamps
    end

    add_index :writing_submissions, [ :user_id, :created_at ]
  end
end
