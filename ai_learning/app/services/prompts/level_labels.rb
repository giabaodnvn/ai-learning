# frozen_string_literal: true

module Prompts
  # The short JLPT label ("N3 — trung cấp") that four grammar prompts
  # interpolate into their "Trình độ:" line.
  #
  # It used to be a constant on GrammarCheckerPrompt, so the exercise, set and
  # tutor prompts each reached across into an unrelated prompt's namespace for
  # it — and each repeated the "N5 — sơ cấp" default at its own call site.
  #
  # The longer per-level descriptions stay on the prompts that own them: they
  # say different things (writing feedback lists kanji counts, the conversation
  # tutor states furigana rules, the level test sizes the vocabulary), so they
  # are not copies of one another.
  module LevelLabels
    SHORT = {
      "n5" => "N5 — sơ cấp",
      "n4" => "N4 — sơ trung",
      "n3" => "N3 — trung cấp",
      "n2" => "N2 — trung cao",
      "n1" => "N1 — cao cấp"
    }.freeze

    DEFAULT_SHORT = SHORT.fetch("n5")

    # Falls back to the N5 label for a missing or unrecognised level.
    def self.short(level)
      SHORT.fetch(level.to_s.downcase, DEFAULT_SHORT)
    end
  end
end
