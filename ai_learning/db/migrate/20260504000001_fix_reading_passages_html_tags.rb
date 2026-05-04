class FixReadingPassagesHtmlTags < ActiveRecord::Migration[7.2]
  def up
    # Update all reading_passages content to remove <p> tags and replace with <br/>
    ReadingPassage.find_each do |passage|
      updated_content = passage.content
        .gsub(/<p>\s*/i, "")
        .gsub(/\s*<\/p>/i, "<br/>")
      passage.update_column(:content, updated_content)
    end
  end

  def down
    # Rollback: restore <p> tags if needed (optional, may not be reversible)
    # In practice, this migration is not reversible as we lose original structure
    raise ActiveRecord::IrreversibleMigration
  end
end
