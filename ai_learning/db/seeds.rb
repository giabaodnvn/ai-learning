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
  File.exist?(single) ? [ single ] : []
end

# Walk every level's part files for one content type, yielding each JSON entry
# with its level. The three types carried a copy of this loop each — same
# globbing, same running total, same two `puts`, and each re-spelled the level
# list inline instead of using JlptLeveled::JLPT_LEVELS. Only the per-record
# assignment actually differed.
def seed_type(type, noun)
  JlptLeveled::JLPT_LEVELS.each do |level|
    files = seed_files(level, type)
    total = 0

    files.each do |path|
      entries = JSON.parse(File.read(path))
      puts "Seeding #{level.upcase} #{type} — #{File.basename(path, '.json')} (#{entries.size} #{noun})..."

      entries.each { |entry| yield(entry, level) }
      total += entries.size
    end

    puts "  → #{level.upcase} #{type}: #{files.size} part(s), #{total} items total"
  end
end

# ── Vocabulary ──────────────────────────────────────────────────────────────
seed_type("vocab", "words") do |w, level|
  v = Vocabulary.find_or_initialize_by(word: w["word"], jlpt_level: level)
  v.reading        = w["reading"]
  v.romaji         = w["romaji"]
  v.meaning_vi     = w["meaning_vi"]
  v.part_of_speech = w["part_of_speech"]
  v.tags           = w["tags"] || []
  v.save!
end

# ── Kanji ────────────────────────────────────────────────────────────────────
seed_type("kanji", "kanji") do |k, level|
  kj = Kanji.find_or_initialize_by(character: k["character"])
  kj.onyomi         = k["onyomi"] || []
  kj.kunyomi        = k["kunyomi"] || []
  kj.meaning_vi     = k["meaning_vi"]
  kj.stroke_count   = k["stroke_count"]
  kj.vocab_examples = k["vocab_examples"] || []
  kj.jlpt_level     = level
  kj.save!
end

# ── Grammar ──────────────────────────────────────────────────────────────────
seed_type("grammar", "patterns") do |g, level|
  gp = GrammarPoint.find_or_initialize_by(pattern: g["pattern"], jlpt_level: level)
  gp.explanation_vi = g["explanation_vi"]
  gp.examples       = g["examples"] || []
  gp.notes_vi       = g["notes_vi"]
  gp.save!
end

puts "\nSeed complete!"
