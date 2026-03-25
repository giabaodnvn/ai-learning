class CreateGrammarPoints < ActiveRecord::Migration[7.2]
  def change
    create_table :grammar_points do |t|
      t.string :pattern,        null: false
      t.text   :explanation_vi, null: false
      t.string :jlpt_level,    null: false
      t.json   :examples
      t.text   :notes_vi

      t.timestamps
    end

    add_index :grammar_points, :jlpt_level
    add_index :grammar_points, :pattern
  end
end
