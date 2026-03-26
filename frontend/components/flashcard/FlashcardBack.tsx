"use client";

import { useState } from "react";
import type { ReviewCard } from "@/lib/stores/flashcardStore";
import { ExplainPanel } from "./ExplainPanel";

interface Props {
  card: ReviewCard;
}

export function FlashcardBack({ card }: Props) {
  const [explainOpen, setExplainOpen] = useState(false);
  const { vocabulary } = card;

  return (
    <>
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-8 min-h-[280px] flex flex-col items-center justify-center gap-4 text-center">
        {/* Word reminder */}
        <p className="text-4xl font-bold text-zinc-900">{vocabulary.word}</p>
        <p className="text-lg text-zinc-400">{vocabulary.reading}</p>

        {/* Meaning box */}
        <div className="w-full rounded-xl bg-white border border-zinc-200 px-6 py-4">
          <p className="text-xl font-semibold text-zinc-800">{vocabulary.meaning_vi}</p>
          {vocabulary.part_of_speech && (
            <p className="mt-1 text-xs text-zinc-400">{vocabulary.part_of_speech}</p>
          )}
        </div>

        {/* Card stats */}
        <p className="text-xs text-zinc-400">
          Lần ôn #{card.repetitions + 1} · Interval: {card.interval} ngày
        </p>

        {/* AI explain trigger */}
        <button
          onClick={() => setExplainOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <span>✨</span>
          AI Giải thích chi tiết
        </button>
      </div>

      <ExplainPanel
        vocabId={vocabulary.id}
        word={vocabulary.word}
        open={explainOpen}
        onClose={() => setExplainOpen(false)}
      />
    </>
  );
}
