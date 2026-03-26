class CreateKanjis < ActiveRecord::Migration[7.2]
  def change
    create_table :kanjis do |t|
      t.string  :character,      null: false
      t.json    :onyomi                        # ["イチ", "イツ"]
      t.json    :kunyomi                       # ["ひと", "ひと.つ"]
      t.string  :meaning_vi,     null: false
      t.string  :jlpt_level,     null: false, default: "n5"
      t.integer :stroke_count
      t.json    :vocab_examples               # [{word, reading, meaning_vi}]
      t.timestamps
    end

    add_index :kanjis, :character,  unique: true
    add_index :kanjis, :jlpt_level
  end
end
