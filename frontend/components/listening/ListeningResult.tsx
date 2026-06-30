import React from "react";
import type { ExerciseData } from "./ExerciseCard";
import type { AnswerResult } from "@/types/quiz";

interface Props {
  exercise: ExerciseData;
  results: AnswerResult[];
  score: number;
  total: number;
  onListenAgain: () => void;
  onNewExercise: () => void;
}

export function ListeningResult({
  exercise,
  results,
  score,
  total,
  onListenAgain,
  onNewExercise,
}: Props) {
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
          {exercise.questions.map((q, i) => {
            const result = results[i];
            if (!result || result.correct) return null;
            return (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-medium text-zinc-800">
                  {i + 1}. {q.question_ja}
                </p>
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
                        <span
                          className={`shrink-0 ${
                            isCorrect ? "text-green-500" : "text-zinc-300"
                          }`}
                        >
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
      {results.every((r) => r.correct) && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
          <p className="text-lg font-semibold text-green-900">
            Tuyệt vời! Bạn đã hoàn toàn hiểu bài! 🌟
          </p>
          <p className="text-sm text-green-700">
            Hãy tiếp tục luyện nghe để cải thiện kỹ năng của mình.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onListenAgain}
          className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Nghe lại
        </button>
        <button
          onClick={onNewExercise}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Bài mới
        </button>
      </div>
    </div>
  );
}
