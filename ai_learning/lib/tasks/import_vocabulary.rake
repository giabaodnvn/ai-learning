# frozen_string_literal: true

namespace :vocab do
  desc "Import JLPT vocabulary from a JSON seed file.\n\n" \
       "  Usage:\n" \
       "    bundle exec rails vocab:import              # imports N5 (default)\n" \
       "    bundle exec rails vocab:import[n4]          # imports specified level\n" \
       "    bundle exec rails vocab:import[n5,true]     # dry-run (no DB writes)\n\n" \
       "  JSON file path: db/seeds/jlpt_<level>_vocab.json\n" \
       "  Each entry: { word, reading, romaji, meaning_vi, part_of_speech, tags }"
  task :import, [:level, :dry_run] => :environment do |_t, args|
    level   = (args[:level].presence || "n5").downcase
    dry_run = args[:dry_run].to_s == "true"

    file_path = Rails.root.join("db", "seeds", "jlpt_#{level}_vocab.json")

    unless File.exist?(file_path)
      abort "File not found: #{file_path}"
    end

    raw  = File.read(file_path)
    data = JSON.parse(raw)

    unless data.is_a?(Array)
      abort "Expected a JSON array in #{file_path}"
    end

    puts "Importing #{data.size} entries for JLPT #{level.upcase}#{dry_run ? ' (DRY RUN)' : ''}..."

    # Build a set of existing word+reading pairs to detect duplicates efficiently.
    existing_pairs = Vocabulary
      .where(jlpt_level: level)
      .pluck(:word, :reading)
      .map { |w, r| [w, r] }
      .to_set

    now         = Time.current
    to_insert   = []
    skipped     = 0
    invalid     = 0

    data.each_with_index do |entry, idx|
      word    = entry["word"].to_s.strip
      reading = entry["reading"].to_s.strip

      if word.blank? || reading.blank?
        puts "  [#{idx + 1}] SKIP — missing word or reading: #{entry.inspect}"
        invalid += 1
        next
      end

      if existing_pairs.include?([word, reading])
        skipped += 1
        next
      end

      to_insert << {
        word:           word,
        reading:        reading,
        romaji:         entry["romaji"].to_s.presence,
        meaning_vi:     entry["meaning_vi"].to_s.strip,
        part_of_speech: entry["part_of_speech"].to_s.presence,
        jlpt_level:     level,
        tags:           (entry["tags"] || []).to_json,
        created_at:     now,
        updated_at:     now
      }

      # Mark as seen so duplicates within the same file are also caught.
      existing_pairs.add([word, reading])
    end

    imported = to_insert.size

    unless dry_run
      # insert_all skips AR callbacks/validations intentionally — we are seeding
      # trusted data and want maximum throughput.
      Vocabulary.insert_all(to_insert) if to_insert.any?
    end

    puts ""
    puts "Done."
    puts "  Imported : #{imported}"
    puts "  Skipped  : #{skipped} (already exist)"
    puts "  Invalid  : #{invalid} (missing word/reading)"
    puts "  Dry run  : #{dry_run}" if dry_run
  end
end
