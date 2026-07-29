"use client";

import type { AnswerResult } from "@/types/quiz";
import { ScoreCard } from "./ScoreCard";

interface QuizResultItem {
  text: string;
  options: string[];
}

interface Props {
  questions: QuizResultItem[];
  results: AnswerResult[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  perfectionMessage?: { title: string; subtitle: string };
}

export function QuizResultCard({
  questions,
  results,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  perfectionMessage,
}: Props) {
  const score = results.filter((r) => r.correct).length;

  return (
    <div className="space-y-5">
      <ScoreCard score={score} total={questions.length} />

      {/* Review wrong answers */}
      {results.some((r) => !r.correct) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700">Xem lại câu sai</h3>
          {questions.map((q, i) => {
            const result = results[i];
            if (!result || result.correct) return null;
            return (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-medium text-zinc-800">
                  {i + 1}. {q.text}
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === result.correct_index;
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isCorrect ? "bg-green-50 text-green-800" : "bg-zinc-50 text-zinc-500"
                        }`}
                      >
                        <span className={`shrink-0 ${isCorrect ? "text-green-500" : "text-zinc-300"}`}>
                          {isCorrect ? "✓" : "○"}
                        </span>
                        <span className="font-medium mr-1">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500 pl-1">{result.explanation_vi}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Perfection message */}
      {perfectionMessage && results.length > 0 && results.every((r) => r.correct) && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
          <p className="text-lg font-semibold text-green-900">{perfectionMessage.title}</p>
          <p className="text-sm text-green-700">{perfectionMessage.subtitle}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSecondary}
          className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          {secondaryLabel}
        </button>
        <button
          onClick={onPrimary}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
