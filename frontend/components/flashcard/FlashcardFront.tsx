"use client";

import type { FlashCard, VocabCard, KanjiCard, GrammarCard } from "@/lib/flashcard-utils";

interface Props {
  card: FlashCard;
  onFlip: () => void;
}

function SpeakerButton({ text }: { text: string }) {
  function handleTTS(e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
  return (
    <button
      onClick={handleTTS}
      title="Nghe phát âm"
      className="rounded-full bg-white/70 border border-stone-200 p-2 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    n5: "bg-emerald-100 text-emerald-700",
    n4: "bg-blue-100 text-blue-700",
    n3: "bg-amber-100 text-amber-700",
    n2: "bg-violet-100 text-violet-700",
    n1: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[level] ?? "bg-zinc-100 text-zinc-600"}`}>
      {level.toUpperCase()}
    </span>
  );
}

function VocabFront({ card }: { card: VocabCard }) {
  return (
    <>
      <p className="text-6xl font-bold text-zinc-900 tracking-wide leading-none">{card.word}</p>
      <p className="text-xl text-zinc-400 mt-2">{card.reading}</p>
      <div className="flex items-center gap-2 mt-3">
        <LevelBadge level={card.jlptLevel} />
        {card.partOfSpeech && (
          <span className="rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs text-zinc-500">
            {card.partOfSpeech}
          </span>
        )}
        <SpeakerButton text={card.word} />
      </div>
    </>
  );
}

function KanjiFront({ card }: { card: KanjiCard }) {
  return (
    <>
      {/* Decorative ghost kanji */}
      <span className="pointer-events-none select-none absolute text-[160px] font-black text-zinc-900/[0.04] leading-none">
        {card.character}
      </span>
      <p className="relative text-[96px] font-bold text-zinc-900 leading-none">{card.character}</p>
      <div className="flex items-center gap-2 mt-4">
        <LevelBadge level={card.jlptLevel} />
        <span className="rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs text-zinc-500">
          {card.strokeCount} nét
        </span>
        <SpeakerButton text={card.character} />
      </div>
    </>
  );
}

function GrammarFront({ card }: { card: GrammarCard }) {
  return (
    <>
      <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-8 py-6 w-full">
        <p className="text-3xl font-bold text-indigo-900 text-center leading-snug">{card.pattern}</p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <LevelBadge level={card.jlptLevel} />
        <span className="rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs text-zinc-500">
          Ngữ pháp
        </span>
      </div>
      <p className="text-xs text-zinc-400">Bạn hiểu cấu trúc này không?</p>
    </>
  );
}

export function FlashcardFront({ card, onFlip }: Props) {
  return (
    <div
      onClick={onFlip}
      className="relative cursor-pointer rounded-2xl border border-stone-200 bg-[#FAF7F2] p-10 text-center min-h-[300px] flex flex-col items-center justify-center gap-3 select-none hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {card.cardType === "vocabulary"   && <VocabFront card={card} />}
      {card.cardType === "kanji"        && <KanjiFront card={card} />}
      {card.cardType === "grammar_point" && <GrammarFront card={card} />}

      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-zinc-400">
        タップ — Nhấn để xem đáp án
      </p>
    </div>
  );
}
