# Seeds for JLPT vocabulary, kanji, and grammar data.
# Idempotent: uses find_or_create_by! so safe to run multiple times.

SEED_DIR = File.join(__dir__, "seeds")

# ── Vocabulary ──────────────────────────────────────────────────────────────
[
  { file: "jlpt_n5_vocab.json", level: "n5" },
  { file: "jlpt_n4_vocab.json", level: "n4" },
].each do |entry|
  path  = File.join(SEED_DIR, entry[:file])
  words = JSON.parse(File.read(path))
  puts "Seeding #{words.size} #{entry[:level].upcase} vocabulary words..."

  words.each do |w|
    Vocabulary.find_or_create_by!(word: w["word"], jlpt_level: entry[:level]) do |v|
      v.reading        = w["reading"]
      v.romaji         = w["romaji"]
      v.meaning_vi     = w["meaning_vi"]
      v.part_of_speech = w["part_of_speech"]
      v.tags           = w["tags"] || []
    end
  end
end

# ── Kanji ────────────────────────────────────────────────────────────────────
[
  { file: "jlpt_n5_kanji.json", level: "n5" },
  { file: "jlpt_n4_kanji.json", level: "n4" },
].each do |entry|
  path    = File.join(SEED_DIR, entry[:file])
  entries = JSON.parse(File.read(path))
  puts "Seeding #{entries.size} #{entry[:level].upcase} kanji..."

  entries.each do |k|
    Kanji.find_or_create_by!(character: k["character"]) do |kj|
      kj.onyomi        = k["onyomi"] || []
      kj.kunyomi       = k["kunyomi"] || []
      kj.meaning_vi    = k["meaning_vi"]
      kj.stroke_count  = k["stroke_count"]
      kj.vocab_examples = k["vocab_examples"] || []
      kj.jlpt_level    = entry[:level]
    end
  end
end

# ── Grammar ──────────────────────────────────────────────────────────────────
[
  { file: "jlpt_n5_grammar.json", level: "n5" },
  { file: "jlpt_n4_grammar.json", level: "n4" },
].each do |entry|
  path    = File.join(SEED_DIR, entry[:file])
  entries = JSON.parse(File.read(path))
  puts "Seeding #{entries.size} #{entry[:level].upcase} grammar points..."

  entries.each do |g|
    GrammarPoint.find_or_create_by!(pattern: g["pattern"], jlpt_level: entry[:level]) do |gp|
      gp.explanation_vi = g["explanation_vi"]
      gp.examples       = g["examples"] || []
      gp.notes_vi       = g["notes_vi"]
    end
  end
end

puts "Seed complete!"
