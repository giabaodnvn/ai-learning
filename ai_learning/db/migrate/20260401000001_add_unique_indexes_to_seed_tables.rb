class AddUniqueIndexesToSeedTables < ActiveRecord::Migration[7.2]
  def up
    # Remove the non-unique index first, then add a unique one
    remove_index :vocabularies, name: "idx_vocabularies_level_word", if_exists: true

    # Remove duplicates before adding unique index (safety)
    execute <<~SQL
      DELETE v1 FROM vocabularies v1
      INNER JOIN vocabularies v2
        ON v1.word = v2.word
        AND v1.jlpt_level = v2.jlpt_level
        AND v1.id > v2.id
    SQL

    add_index :vocabularies, [:jlpt_level, :word], unique: true,
              name: "idx_vocabularies_level_word_unique"

    # grammar_points: unique on (pattern, jlpt_level)
    remove_index :grammar_points, name: "index_grammar_points_on_pattern", if_exists: true

    execute <<~SQL
      DELETE g1 FROM grammar_points g1
      INNER JOIN grammar_points g2
        ON g1.pattern = g2.pattern
        AND g1.jlpt_level = g2.jlpt_level
        AND g1.id > g2.id
    SQL

    add_index :grammar_points, [:pattern, :jlpt_level], unique: true,
              name: "idx_grammar_points_pattern_level_unique"
  end

  def down
    remove_index :vocabularies, name: "idx_vocabularies_level_word_unique", if_exists: true
    add_index :vocabularies, [:jlpt_level, :word], name: "idx_vocabularies_level_word"

    remove_index :grammar_points, name: "idx_grammar_points_pattern_level_unique", if_exists: true
    add_index :grammar_points, :pattern, name: "index_grammar_points_on_pattern"
  end
end
