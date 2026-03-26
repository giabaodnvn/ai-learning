"use client";

import { useState } from "react";
import type { FlashCard, VocabCard, KanjiCard, GrammarCard } from "@/lib/flashcard-utils";
import { ExplainPanel } from "./ExplainPanel";

interface Props {
  card: FlashCard;
}

function VocabBack({ card }: { card: VocabCard }) {
  const [explainOpen, setExplainOpen] = useState(false);
  return (
    <>
      <p className="text-4xl font-bold text-zinc-900">{card.word}</p>
      <p className="text-lg text-zinc-400">{card.reading}</p>
      <div className="w-full rounded-xl bg-white border border-zinc-200 px-6 py-4">
        <p className="text-xl font-semibold text-zinc-800">{card.meaningVi}</p>
        {card.partOfSpeech && (
          <p className="mt-1 text-xs text-zinc-400">{card.partOfSpeech}</p>
        )}
      </div>
      <p className="text-xs text-zinc-400">
        Lần ôn #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>
      <button
        onClick={() => setExplainOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <span>✨</span>
        AI Giải thích chi tiết
      </button>
      <ExplainPanel
        vocabId={card.cardId}
        word={card.word}
        open={explainOpen}
        onClose={() => setExplainOpen(false)}
      />
    </>
  );
}

function KanjiBack({ card }: { card: KanjiCard }) {
  return (
    <>
      <p className="text-5xl font-bold text-zinc-900">{card.character}</p>
      <div className="w-full rounded-xl bg-white border border-zinc-200 px-6 py-4 space-y-3">
        <p className="text-xl font-semibold text-zinc-800 text-center">{card.meaningVi}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
            <p className="text-xs text-orange-500 font-medium mb-1">音読み (Onyomi)</p>
            <p className="font-semibold text-zinc-800">
              {card.onyomi.length > 0 ? card.onyomi.join("、") : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2">
            <p className="text-xs text-teal-600 font-medium mb-1">訓読み (Kunyomi)</p>
            <p className="font-semibold text-zinc-800">
              {card.kunyomi.length > 0 ? card.kunyomi.join("、") : "—"}
            </p>
          </div>
        </div>
      </div>
      {card.vocabExamples.length > 0 && (
        <div className="w-full space-y-1">
          <p className="text-xs text-zinc-400 text-left font-medium">Từ vựng liên quan:</p>
          <div className="flex flex-wrap gap-2">
            {card.vocabExamples.slice(0, 4).map((ex, i) => (
              <span key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
                {ex.word}
                <span className="text-zinc-400 ml-1">({ex.reading})</span>
                <span className="text-zinc-500 ml-1">— {ex.meaning_vi}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-zinc-400">
        Lần ôn #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>
    </>
  );
}

function GrammarBack({ card }: { card: GrammarCard }) {
  return (
    <>
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-6 py-3 w-full text-center">
        <p className="text-2xl font-bold text-indigo-900">{card.pattern}</p>
      </div>
      <div className="w-full rounded-xl bg-white border border-zinc-200 px-6 py-4">
        <p className="text-base font-semibold text-zinc-800">{card.explanationVi}</p>
        {card.notesVi && (
          <p className="mt-2 text-xs text-zinc-500 italic">{card.notesVi}</p>
        )}
      </div>
      {card.examples.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs text-zinc-400 text-left font-medium">Ví dụ:</p>
          {card.examples.slice(0, 2).map((ex, i) => (
            <div key={i} className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-left">
              <p className="text-sm font-medium text-zinc-800">{ex.ja}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{ex.vi}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-400">
        Lần ôn #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>
    </>
  );
}

export function FlashcardBack({ card }: Props) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-8 min-h-[280px] flex flex-col items-center justify-center gap-4 text-center">
      {card.cardType === "vocabulary" && <VocabBack card={card} />}
      {card.cardType === "kanji" && <KanjiBack card={card} />}
      {card.cardType === "grammar_point" && <GrammarBack card={card} />}
    </div>
  );
}
