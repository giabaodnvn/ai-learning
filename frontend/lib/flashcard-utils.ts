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

/**
 * Vietnamese name of each card type. Four screens carried their own
 * `cardType === "vocabulary" ? "Từ vựng" : …` chain, so adding a type meant
 * finding all four.
 */
export const CARD_TYPE_LABELS: Record<FlashCard["cardType"], string> = {
  vocabulary:    "Từ vựng",
  kanji:         "Kanji",
  grammar_point: "Ngữ pháp",
};

/** Same, plus the "daily" session that mixes every type. */
export const SESSION_MODE_LABELS: Record<SessionMode, string> = {
  daily: "Hằng ngày",
  ...CARD_TYPE_LABELS,
};

/**
 * The `type` query param a session mode maps to: "daily" draws from every
 * card type, the rest name themselves. The deck and the mode picker each had
 * their own copy of this one-line mapping.
 */
export function apiTypeFor(mode: SessionMode): string {
  return mode === "daily" ? "all" : mode;
}

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

// ─── Grade buttons ───────────────────────────────────────────────────────────

/**
 * Button colour per SM-2 grade (0 = forgot … 3 = easy). Indexed by grade, so
 * the review screen's 0/3/4/5 scale and the flashcard deck's 0-3 scale share
 * one palette instead of four copies of the same four strings.
 */
export const GRADE_COLORS = [
  "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
  "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
  "border-green-300 bg-green-50 text-green-700 hover:bg-green-100",
] as const;

/**
 * Emoji per grade, and the softer background used on the session summary
 * (the deck's buttons want a hover state, the summary tiles do not).
 */
export const GRADE_EMOJI = [ "😰", "😅", "😊", "🌟" ] as const;

export const GRADE_TILE_COLORS = [
  "bg-red-50 border border-red-100 text-red-700",
  "bg-amber-50 border border-amber-100 text-amber-700",
  "bg-blue-50 border border-blue-100 text-blue-700",
  "bg-emerald-50 border border-emerald-100 text-emerald-700",
] as const;

export interface GradeLabel {
  grade: number;
  ja: string;
  vi: string;
  color: string;
}

// Only the wording differs per card type; the grade order and colours do not.
const GRADE_WORDING: Record<FlashCard["cardType"], { ja: string; vi: string }[]> = {
  vocabulary: [
    { ja: "また", vi: "Quên rồi" },
    { ja: "難しい", vi: "Khó" },
    { ja: "良い", vi: "Ổn" },
    { ja: "簡単", vi: "Dễ" },
  ],
  kanji: [
    { ja: "また", vi: "Quên" },
    { ja: "難しい", vi: "Khó nhớ" },
    { ja: "良い", vi: "Nhớ" },
    { ja: "完璧", vi: "Thuộc" },
  ],
  grammar_point: [
    { ja: "また", vi: "Quên" },
    { ja: "曖昧", vi: "Lờ mờ" },
    { ja: "良い", vi: "Nhớ" },
    { ja: "完璧", vi: "Thuộc" },
  ],
};

export const GRADE_LABELS: Record<FlashCard["cardType"], GradeLabel[]> = Object.fromEntries(
  Object.entries(GRADE_WORDING).map(([cardType, wording]) => [
    cardType,
    wording.map((w, grade) => ({ grade, ...w, color: GRADE_COLORS[grade] })),
  ])
) as Record<FlashCard["cardType"], GradeLabel[]>;
