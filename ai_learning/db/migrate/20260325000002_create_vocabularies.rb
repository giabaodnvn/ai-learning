class CreateVocabularies < ActiveRecord::Migration[7.2]
  def change
    create_table :vocabularies do |t|
      t.string  :word,           null: false
      t.string  :reading,        null: false
      t.string  :romaji
      t.text    :meaning_vi,     null: false
      t.string  :jlpt_level,    null: false
      t.string  :part_of_speech
      t.json    :tags

      t.timestamps
    end

    add_index :vocabularies, :jlpt_level
    add_index :vocabularies, :word
    add_index :vocabularies, :part_of_speech
  end
end
