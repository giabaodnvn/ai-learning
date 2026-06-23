# Seeds for JLPT vocabulary, kanji, and grammar data.
# Idempotent upsert: find_or_initialize_by + save! so re-running both inserts
# new records AND updates edited fields (meaning_vi, examples, ...) from JSON.
#
# File convention: jlpt_{level}_{type}_part{N}.json
# Parts are loaded in sorted order (part1, part2, ...).
# Original single files (e.g. jlpt_n4_vocab.json) are kept as backup but
# are no longer used directly — data lives in part files.

SEED_DIR = File.join(__dir__, "seeds")

def seed_files(level, type)
  parts = Dir.glob(File.join(SEED_DIR, "jlpt_#{level}_#{type}_part*.json")).sort
  return parts if parts.any?

  # Fallback: single file for levels not yet split
  single = File.join(SEED_DIR, "jlpt_#{level}_#{type}.json")
  File.exist?(single) ? [single] : []
end

# ── Vocabulary ──────────────────────────────────────────────────────────────
%w[n5 n4 n3 n2 n1].each do |level|
  files = seed_files(level, "vocab")
  total = 0

  files.each do |path|
    words      = JSON.parse(File.read(path))
    part_label = File.basename(path, ".json")
    puts "Seeding #{level.upcase} vocab — #{part_label} (#{words.size} words)..."

    words.each do |w|
      v = Vocabulary.find_or_initialize_by(word: w["word"], jlpt_level: level)
      v.reading        = w["reading"]
      v.romaji         = w["romaji"]
      v.meaning_vi     = w["meaning_vi"]
      v.part_of_speech = w["part_of_speech"]
      v.tags           = w["tags"] || []
      v.save!
    end

    total += words.size
  end

  puts "  → #{level.upcase} vocab: #{files.size} part(s), #{total} items total"
end

# ── Kanji ────────────────────────────────────────────────────────────────────
%w[n5 n4 n3 n2 n1].each do |level|
  files = seed_files(level, "kanji")
  total = 0

  files.each do |path|
    entries    = JSON.parse(File.read(path))
    part_label = File.basename(path, ".json")
    puts "Seeding #{level.upcase} kanji — #{part_label} (#{entries.size} kanji)..."

    entries.each do |k|
      kj = Kanji.find_or_initialize_by(character: k["character"])
      kj.onyomi         = k["onyomi"] || []
      kj.kunyomi        = k["kunyomi"] || []
      kj.meaning_vi     = k["meaning_vi"]
      kj.stroke_count   = k["stroke_count"]
      kj.vocab_examples = k["vocab_examples"] || []
      kj.jlpt_level     = level
      kj.save!
    end

    total += entries.size
  end

  puts "  → #{level.upcase} kanji: #{files.size} part(s), #{total} items total"
end

# ── Grammar ──────────────────────────────────────────────────────────────────
%w[n5 n4 n3 n2 n1].each do |level|
  files = seed_files(level, "grammar")
  total = 0

  files.each do |path|
    entries    = JSON.parse(File.read(path))
    part_label = File.basename(path, ".json")
    puts "Seeding #{level.upcase} grammar — #{part_label} (#{entries.size} patterns)..."

    entries.each do |g|
      gp = GrammarPoint.find_or_initialize_by(pattern: g["pattern"], jlpt_level: level)
      gp.explanation_vi = g["explanation_vi"]
      gp.examples       = g["examples"] || []
      gp.notes_vi       = g["notes_vi"]
      gp.save!
    end

    total += entries.size
  end

  puts "  → #{level.upcase} grammar: #{files.size} part(s), #{total} items total"
end

puts "\nSeed complete!"
