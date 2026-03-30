import React from "react";
import type { PassageData, Question } from "./PassageCard";

interface AnswerResult {
  correct: boolean;
  correct_index: number;
  explanation_vi: string;
}

interface Props {
  passage: PassageData;
  results: AnswerResult[];
  onReadAgain: () => void;
  onNewPassage: () => void;
}

export function ResultScreen({ passage, results, onReadAgain, onNewPassage }: Props) {
  const score   = results.filter((r) => r.correct).length;
  const total   = passage.questions.length;
  const percent = Math.round((score / total) * 100);

  const emoji =
    percent === 100 ? "🏆" : percent >= 75 ? "🎉" : percent >= 50 ? "😊" : "📚";

  return (
    <div className="space-y-5">
      {/* Score card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-2">
        <div className="text-4xl">{emoji}</div>
        <p className="text-3xl font-bold text-zinc-900">
          {score} <span className="text-zinc-400 font-normal text-xl">/ {total}</span>
        </p>
        <p className="text-sm text-zinc-500">
          {percent}% câu trả lời đúng
        </p>
        <div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percent >= 75 ? "bg-green-400" : percent >= 50 ? "bg-yellow-400" : "bg-red-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Review wrong answers */}
      {results.some((r) => !r.correct) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700">Xem lại câu sai</h3>
          {passage.questions.map((q: Question, i: number) => {
            const result = results[i];
            if (!result || result.correct) return null;
            return (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-medium text-zinc-800">
                  {i + 1}. {q.question}
                </p>
                {/* All options with correct/wrong markers */}
                <div className="space-y-1">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === result.correct_index;
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isCorrect
                            ? "bg-green-50 text-green-800"
                            : "bg-zinc-50 text-zinc-500"
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReadAgain}
          className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Đọc lại
        </button>
        <button
          onClick={onNewPassage}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Bài mới
        </button>
      </div>
    </div>
  );
}
