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
      <p className="text-4xl font-bold text-zinc-900 leading-none">{card.word}</p>
      <p className="text-lg text-indigo-400 mt-1">{card.reading}</p>

      <div className="w-full rounded-2xl bg-white border border-indigo-100 px-6 py-4 shadow-sm">
        <p className="text-xl font-bold text-zinc-800">{card.meaningVi}</p>
        {card.partOfSpeech && (
          <p className="mt-1 text-xs text-zinc-400">{card.partOfSpeech}</p>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Lần #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>

      <button
        onClick={() => setExplainOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        ✨ AI Giải thích chi tiết
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
      <p className="text-6xl font-bold text-zinc-900 leading-none">{card.character}</p>

      <div className="w-full rounded-2xl bg-white border border-indigo-100 px-5 py-4 shadow-sm space-y-3">
        <p className="text-xl font-bold text-zinc-800 text-center">{card.meaningVi}</p>
        <div className="grid grid-cols-2 gap-2.5 text-sm">
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide mb-1">音読み</p>
            <p className="font-bold text-zinc-800 leading-tight">
              {card.onyomi.length > 0 ? card.onyomi.join("・") : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-2.5">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-1">訓読み</p>
            <p className="font-bold text-zinc-800 leading-tight">
              {card.kunyomi.length > 0 ? card.kunyomi.join("・") : "—"}
            </p>
          </div>
        </div>
      </div>

      {card.vocabExamples.length > 0 && (
        <div className="w-full space-y-1.5">
          <p className="text-xs font-semibold text-zinc-400 text-left">Từ vựng liên quan</p>
          <div className="flex flex-wrap gap-2">
            {card.vocabExamples.slice(0, 4).map((ex, i) => (
              <span key={i} className="rounded-xl bg-white border border-stone-200 px-3 py-1.5 text-xs text-zinc-700">
                <span className="font-semibold">{ex.word}</span>
                <span className="text-zinc-400 ml-1">({ex.reading})</span>
                <span className="text-zinc-500 ml-1">— {ex.meaning_vi}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Lần #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>
    </>
  );
}

function GrammarBack({ card }: { card: GrammarCard }) {
  return (
    <>
      <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-6 py-4 w-full text-center">
        <p className="text-2xl font-bold text-indigo-900">{card.pattern}</p>
      </div>

      <div className="w-full rounded-2xl bg-white border border-indigo-100 px-6 py-4 shadow-sm">
        <p className="text-base font-semibold text-zinc-800">{card.explanationVi}</p>
        {card.notesVi && (
          <p className="mt-2 text-xs text-zinc-500 italic">{card.notesVi}</p>
        )}
      </div>

      {card.examples.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs font-semibold text-zinc-400 text-left">Ví dụ</p>
          {card.examples.slice(0, 2).map((ex, i) => (
            <div key={i} className="rounded-xl bg-white border border-stone-200 px-4 py-3 text-left shadow-sm">
              <p className="text-sm font-semibold text-zinc-800">{ex.ja}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{ex.vi}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Lần #{card.repetitions + 1} · Interval: {card.interval} ngày
      </p>
    </>
  );
}

export function FlashcardBack({ card }: Props) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-[#F0F2FF] via-white to-white p-8 min-h-[300px] flex flex-col items-center justify-center gap-4 text-center shadow-sm">
      {card.cardType === "vocabulary"    && <VocabBack card={card} />}
      {card.cardType === "kanji"         && <KanjiBack card={card} />}
      {card.cardType === "grammar_point" && <GrammarBack card={card} />}
    </div>
  );
}
