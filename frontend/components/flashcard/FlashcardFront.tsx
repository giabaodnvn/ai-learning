"use client";

import type { ReviewCard } from "@/lib/stores/flashcardStore";

interface Props {
  vocabulary: ReviewCard["vocabulary"];
  onFlip: () => void;
}

export function FlashcardFront({ vocabulary, onFlip }: Props) {
  function handleTTS(e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(vocabulary.word);
    utter.lang = "ja-JP";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <div
      onClick={onFlip}
      className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-10 text-center min-h-[280px] flex flex-col items-center justify-center gap-4 select-none hover:border-zinc-300 transition-colors"
    >
      {/* Word */}
      <p className="text-6xl font-bold text-zinc-900 tracking-wide">
        {vocabulary.word}
      </p>

      {/* Reading */}
      <p className="text-2xl text-zinc-400">{vocabulary.reading}</p>

      {/* Badges + TTS */}
      <div className="flex items-center gap-2 mt-1">
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {vocabulary.jlpt_level.toUpperCase()}
        </span>
        {vocabulary.part_of_speech && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
            {vocabulary.part_of_speech}
          </span>
        )}
        <button
          onClick={handleTTS}
          title="Nghe phát âm (ja-JP)"
          className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
        >
          {/* Speaker icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-zinc-400 mt-3">Nhấn để xem đáp án</p>
    </div>
  );
}
