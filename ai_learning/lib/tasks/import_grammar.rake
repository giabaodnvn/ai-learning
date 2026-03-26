# frozen_string_literal: true

namespace :grammar do
  desc "Import JLPT grammar points from db/seeds/jlpt_<level>_grammar.json\n\n" \
       "  Usage:\n" \
       "    bundle exec rails grammar:import          # N5 (default)\n" \
       "    bundle exec rails grammar:import[n4]      # N4\n" \
       "    bundle exec rails grammar:import[n5,true] # dry-run"
  task :import, [:level, :dry_run] => :environment do |_t, args|
    level   = (args[:level].presence || "n5").downcase
    dry_run = args[:dry_run].to_s == "true"

    file_path = Rails.root.join("db", "seeds", "jlpt_#{level}_grammar.json")
    abort "File not found: #{file_path}" unless File.exist?(file_path)

    data = JSON.parse(File.read(file_path))
    abort "Expected a JSON array in #{file_path}" unless data.is_a?(Array)

    puts "Importing #{data.size} grammar points for JLPT #{level.upcase}#{dry_run ? ' (DRY RUN)' : ''}..."

    existing  = GrammarPoint.where(jlpt_level: level).pluck(:pattern).to_set
    to_insert = []
    skipped   = 0
    invalid   = 0
    now       = Time.current

    data.each_with_index do |entry, idx|
      pattern = entry["pattern"].to_s.strip

      if pattern.blank?
        puts "  [#{idx + 1}] SKIP — missing pattern: #{entry.inspect}"
        invalid += 1
        next
      end

      if existing.include?(pattern)
        skipped += 1
        next
      end

      to_insert << {
        pattern:        pattern,
        explanation_vi: entry["explanation_vi"].to_s.strip,
        jlpt_level:     level,
        examples:       (entry["examples"] || []).to_json,
        notes_vi:       entry["notes_vi"].to_s.presence,
        created_at:     now,
        updated_at:     now
      }
      existing.add(pattern)
    end

    GrammarPoint.insert_all(to_insert) if !dry_run && to_insert.any?

    puts ""
    puts "Done."
    puts "  Imported : #{to_insert.size}"
    puts "  Skipped  : #{skipped} (already exist)"
    puts "  Invalid  : #{invalid} (missing pattern)"
    puts "  Dry run  : #{dry_run}" if dry_run
  end
end
