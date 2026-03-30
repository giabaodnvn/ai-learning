class AddTitleAndVocabHighlightsToReadingPassages < ActiveRecord::Migration[7.2]
  def change
    add_column :reading_passages, :title, :string
    add_column :reading_passages, :vocabulary_highlights, :json
  end
end
