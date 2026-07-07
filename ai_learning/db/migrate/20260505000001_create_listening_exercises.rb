# frozen_string_literal: true

class CreateListeningExercises < ActiveRecord::Migration[7.2]
  def change
    create_table :listening_exercises do |t|
      t.string  :jlpt_level,    null: false
      t.string  :topic,         null: false
      t.string  :title,         null: false
      t.text    :script_ja,     null: false
      t.text    :script_vi,     null: false
      t.json    :questions,     null: false
      t.boolean :ai_generated,  null: false, default: true

      t.timestamps
    end

    add_index :listening_exercises, :jlpt_level
    add_index :listening_exercises, [ :jlpt_level, :topic ]
    add_index :listening_exercises, :ai_generated
  end
end
