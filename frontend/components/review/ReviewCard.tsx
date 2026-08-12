"use client";

/** One card in the SRS queue, as `GET /api/v1/review/queue` returns it. */
export interface ReviewCard {
  id: number;
  card_type: "vocabulary" | "kanji" | "grammar_point";
  due_date: string;
  repetitions: number;
  interval: number;
  ease_factor: number;
  // Exactly one of these is present, named after `card_type`:
  vocabulary?: {
    id: number;
    word: string;
    reading: string;
    meaning_vi: string;
    part_of_speech: string;
    jlpt_level: string;
  };
  kanji?: {
    id: number;
    character: string;
    reading_on: string;
    meaning_vi: string;
    jlpt_level: string;
  };
  grammar_point?: {
    id: number;
    pattern: string;
    explanation_vi: string;
    jlpt_level: string;
  };
}

export interface CardDisplay {
  front: string;
  reading: string | null;
  meaning_vi: string;
  tag: string | null;
  jlpt_level: string;
}

/** Flatten the type-specific payload into the four fields this screen shows. */
export function cardDisplay(card: ReviewCard): CardDisplay {
  if (card.card_type === "kanji" && card.kanji) {
    return {
      front: card.kanji.character,
      reading: card.kanji.reading_on,
      meaning_vi: card.kanji.meaning_vi,
      tag: "Kanji",
      jlpt_level: card.kanji.jlpt_level,
    };
  }
  if (card.card_type === "grammar_point" && card.grammar_point) {
    return {
      front: card.grammar_point.pattern,
      reading: null,
      meaning_vi: card.grammar_point.explanation_vi,
      tag: "Ngữ pháp",
      jlpt_level: card.grammar_point.jlpt_level,
    };
  }
  return {
    front: card.vocabulary?.word ?? "",
    reading: card.vocabulary?.reading ?? "",
    meaning_vi: card.vocabulary?.meaning_vi ?? "",
    tag: card.vocabulary?.part_of_speech ?? null,
    jlpt_level: card.vocabulary?.jlpt_level ?? "",
  };
}

interface Props {
  display: CardDisplay;
  revealed: boolean;
  onReveal: () => void;
}

/** The tap-to-flip card face. */
export function ReviewCardFace({ display, revealed, onReveal }: Props) {
  return (
    <div
      className="rounded-2xl border border-zinc-200 bg-white p-10 text-center cursor-pointer min-h-[220px] flex flex-col items-center justify-center gap-4 select-none hover:border-zinc-300 transition-colors"
      onClick={() => !revealed && onReveal()}
    >
      <p className="text-5xl font-bold text-zinc-900">{display.front}</p>

      {!revealed ? (
        <p className="text-sm text-zinc-400 mt-4">Nhấn để xem đáp án</p>
      ) : (
        <div className="space-y-2 mt-2">
          {display.reading && <p className="text-lg text-zinc-600">{display.reading}</p>}
          <p className="text-xl font-semibold text-zinc-800">{display.meaning_vi}</p>
          {display.tag && (
            <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {display.tag}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
