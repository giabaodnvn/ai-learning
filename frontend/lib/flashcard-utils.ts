// ─── Discriminated union types for all card variants ─────────────────────────

interface BaseCard {
  progressId: number | null;
  cardType: "vocabulary" | "kanji" | "grammar_point";
  cardId: number;
  jlptLevel: string;
  dueDate: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
}

export interface VocabCard extends BaseCard {
  cardType: "vocabulary";
  word: string;
  reading: string;
  meaningVi: string;
  partOfSpeech: string | null;
}

export interface KanjiCard extends BaseCard {
  cardType: "kanji";
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaningVi: string;
  strokeCount: number;
  vocabExamples: { word: string; reading: string; meaning_vi: string }[];
}

export interface GrammarCard extends BaseCard {
  cardType: "grammar_point";
  pattern: string;
  explanationVi: string;
  examples: { ja: string; vi: string }[];
  notesVi: string | null;
}

export type FlashCard = VocabCard | KanjiCard | GrammarCard;

export type SessionMode = "daily" | "vocabulary" | "kanji" | "grammar_point";

// ─── Learn mode (random pick + quiz) ─────────────────────────────────────────

export interface LearnConfig {
  level: string;
  vocabCount: number;
  kanjiCount: number;
  grammarCount: number;
}

// A card returned by GET /flashcards/random — includes learned status
export type RandomCard = FlashCard & { learned: boolean };

export interface QuizQuestion {
  cardType: FlashCard["cardType"];
  cardId: number;
  question: string;       // word / character / pattern
  questionHint: string | null;
  options: string[];      // 4 shuffled options
  correct: number;        // index into options (0-3)
}

export interface QuizResult {
  cardType: FlashCard["cardType"];
  cardId: number;
  learned: boolean;       // true = answered correctly
}

// ─── API response → FlashCard mapper ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiCard(raw: any): FlashCard {
  const base = {
    progressId: raw.progress_id ?? null,
    cardId:     raw.card_id,
    jlptLevel:  raw.jlpt_level,
    dueDate:    raw.due_date,
    repetitions: raw.repetitions ?? 0,
    interval:   raw.interval ?? 1,
    easeFactor: raw.ease_factor ?? 2.5,
  };

  switch (raw.card_type as string) {
    case "vocabulary":
      return {
        ...base,
        cardType:     "vocabulary",
        word:         raw.word,
        reading:      raw.reading,
        meaningVi:    raw.meaning_vi,
        partOfSpeech: raw.part_of_speech ?? null,
      };
    case "kanji":
      return {
        ...base,
        cardType:      "kanji",
        character:     raw.character,
        onyomi:        raw.onyomi ?? [],
        kunyomi:       raw.kunyomi ?? [],
        meaningVi:     raw.meaning_vi,
        strokeCount:   raw.stroke_count ?? 0,
        vocabExamples: raw.vocab_examples ?? [],
      };
    case "grammar_point":
      return {
        ...base,
        cardType:       "grammar_point",
        pattern:        raw.pattern,
        explanationVi:  raw.explanation_vi,
        examples:       raw.examples ?? [],
        notesVi:        raw.notes_vi ?? null,
      };
    default:
      throw new Error(`Unknown card_type: ${raw.card_type}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRandomCard(raw: any): RandomCard {
  return { ...mapApiCard(raw), learned: raw.learned ?? false };
}

// ─── Grade label sets per card type ──────────────────────────────────────────

export const GRADE_LABELS: Record<
  FlashCard["cardType"],
  { grade: number; ja: string; vi: string; color: string }[]
> = {
  vocabulary: [
    { grade: 0, ja: "また",   vi: "Quên rồi", color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
    { grade: 1, ja: "難しい", vi: "Khó",      color: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { grade: 2, ja: "良い",   vi: "Ổn",       color: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { grade: 3, ja: "簡単",   vi: "Dễ",       color: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" },
  ],
  kanji: [
    { grade: 0, ja: "また",   vi: "Quên",     color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
    { grade: 1, ja: "難しい", vi: "Khó nhớ",  color: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { grade: 2, ja: "良い",   vi: "Nhớ",      color: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { grade: 3, ja: "完璧",   vi: "Thuộc",    color: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" },
  ],
  grammar_point: [
    { grade: 0, ja: "また",   vi: "Quên",     color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
    { grade: 1, ja: "曖昧",   vi: "Lờ mờ",   color: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { grade: 2, ja: "良い",   vi: "Nhớ",      color: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { grade: 3, ja: "完璧",   vi: "Thuộc",    color: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" },
  ],
};
