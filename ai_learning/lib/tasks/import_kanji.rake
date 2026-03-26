# frozen_string_literal: true

namespace :kanji do
  desc "Import JLPT kanji from db/seeds/jlpt_<level>_kanji.json\n\n" \
       "  Usage:\n" \
       "    bundle exec rails kanji:import          # N5 (default)\n" \
       "    bundle exec rails kanji:import[n4]      # N4\n" \
       "    bundle exec rails kanji:import[n5,true] # dry-run"
  task :import, [:level, :dry_run] => :environment do |_t, args|
    level   = (args[:level].presence || "n5").downcase
    dry_run = args[:dry_run].to_s == "true"

    file_path = Rails.root.join("db", "seeds", "jlpt_#{level}_kanji.json")
    abort "File not found: #{file_path}" unless File.exist?(file_path)

    data = JSON.parse(File.read(file_path))
    abort "Expected a JSON array in #{file_path}" unless data.is_a?(Array)

    puts "Importing #{data.size} kanji for JLPT #{level.upcase}#{dry_run ? ' (DRY RUN)' : ''}..."

    existing = Kanji.where(jlpt_level: level).pluck(:character).to_set
    to_insert = []
    skipped   = 0
    invalid   = 0
    now       = Time.current

    data.each_with_index do |entry, idx|
      char = entry["character"].to_s.strip

      if char.blank?
        puts "  [#{idx + 1}] SKIP — missing character: #{entry.inspect}"
        invalid += 1
        next
      end

      if existing.include?(char)
        skipped += 1
        next
      end

      to_insert << {
        character:      char,
        onyomi:         (entry["onyomi"] || []).to_json,
        kunyomi:        (entry["kunyomi"] || []).to_json,
        meaning_vi:     entry["meaning_vi"].to_s.strip,
        jlpt_level:     level,
        stroke_count:   entry["stroke_count"].to_i,
        vocab_examples: (entry["vocab_examples"] || []).to_json,
        created_at:     now,
        updated_at:     now
      }
      existing.add(char)
    end

    Kanji.insert_all(to_insert) if !dry_run && to_insert.any?

    puts ""
    puts "Done."
    puts "  Imported : #{to_insert.size}"
    puts "  Skipped  : #{skipped} (already exist)"
    puts "  Invalid  : #{invalid} (missing character)"
    puts "  Dry run  : #{dry_run}" if dry_run
  end
end
