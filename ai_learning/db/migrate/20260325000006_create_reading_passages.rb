class CreateReadingPassages < ActiveRecord::Migration[7.2]
  def change
    create_table :reading_passages do |t|
      t.text    :content,      null: false
      t.string  :jlpt_level,  null: false
      t.string  :topic
      t.json    :questions
      t.boolean :ai_generated, null: false, default: false

      t.timestamps
    end

    add_index :reading_passages, :jlpt_level
    add_index :reading_passages, :ai_generated
    add_index :reading_passages, [ :jlpt_level, :topic ]
  end
end
