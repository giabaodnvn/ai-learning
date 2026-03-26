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
      className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
      {level.toUpperCase()}
    </span>
  );
}

function VocabFront({ card }: { card: VocabCard }) {
  return (
    <>
      <p className="text-6xl font-bold text-zinc-900 tracking-wide">{card.word}</p>
      <p className="text-2xl text-zinc-400">{card.reading}</p>
      <div className="flex items-center gap-2 mt-1">
        <LevelBadge level={card.jlptLevel} />
        {card.partOfSpeech && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
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
      <p className="text-8xl font-bold text-zinc-900">{card.character}</p>
      <div className="flex items-center gap-2 mt-2">
        <LevelBadge level={card.jlptLevel} />
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
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
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-8 py-5">
        <p className="text-3xl font-bold text-indigo-900 text-center">{card.pattern}</p>
      </div>
      <div className="flex items-center gap-2">
        <LevelBadge level={card.jlptLevel} />
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
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
      className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-10 text-center min-h-[280px] flex flex-col items-center justify-center gap-4 select-none hover:border-zinc-300 transition-colors"
    >
      {card.cardType === "vocabulary" && <VocabFront card={card} />}
      {card.cardType === "kanji" && <KanjiFront card={card} />}
      {card.cardType === "grammar_point" && <GrammarFront card={card} />}
      <p className="text-xs text-zinc-400 mt-2">Nhấn để xem đáp án</p>
    </div>
  );
}
