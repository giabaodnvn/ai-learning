"use client";

import { useState } from "react";
import type { QuizQuestion as QuizQuestionType } from "@/lib/flashcard-utils";

interface Props {
  question: QuizQuestionType;
  index: number;
  total: number;
  onAnswer: (correct: boolean) => void;
}

export function QuizQuestion({ question, index, total, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const isCorrect = selected === question.correct;

  function handleSelect(i: number) {
    if (answered) return;
    setSelected(i);
  }

  const cardTypeLabel =
    question.cardType === "vocabulary" ? "Từ vựng" :
    question.cardType === "kanji"      ? "Kanji" :
    "Ngữ pháp";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{index + 1} / {total}</span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {cardTypeLabel}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((index) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
          Nghĩa của
        </p>
        <p className="text-5xl font-bold text-zinc-900">{question.question}</p>
        {question.questionHint && (
          <p className="text-sm text-zinc-400">{question.questionHint}</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {question.options.map((opt, i) => {
          let style = "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50";
          if (answered) {
            if (i === question.correct) {
              style = "border-green-400 bg-green-50 text-green-800";
            } else if (i === selected) {
              style = "border-red-400 bg-red-50 text-red-800";
            } else {
              style = "border-zinc-200 bg-white text-zinc-400";
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${style}`}
            >
              <span className="mr-2 text-xs opacity-50">{["A", "B", "C", "D"][i]}.</span>
              {opt}
              {answered && i === question.correct && (
                <span className="ml-2 text-green-600">✓</span>
              )}
              {answered && i === selected && i !== question.correct && (
                <span className="ml-2 text-red-500">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {answered && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${
          isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {isCorrect ? "Chính xác! Đã thuộc thẻ này." : `Sai rồi. Đáp án đúng: "${question.options[question.correct]}"`}
        </div>
      )}

      {answered && (
        <button
          onClick={() => onAnswer(isCorrect)}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          {index + 1 < total ? "Câu tiếp theo →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}
