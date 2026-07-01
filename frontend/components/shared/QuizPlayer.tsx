"use client";

import { useState } from "react";
import type { AnswerResult } from "@/types/quiz";

export interface QuizPlayerQuestion {
  text: string;
  options: string[];
  answer_index: number;
}

interface QuizState {
  selectedIndex: number | null;
  result: AnswerResult | null;
}

interface Props {
  questions: QuizPlayerQuestion[];
  onFinish: (results: AnswerResult[], selectedIndices: number[]) => void;
  submitError?: string | null;
}

export function QuizPlayer({ questions, onFinish, submitError }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStates, setQuizStates] = useState<QuizState[]>(
    questions.map(() => ({ selectedIndex: null, result: null }))
  );

  const question = questions[currentIndex];
  const state = quizStates[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function handleAnswer(optionIndex: number) {
    if (state.selectedIndex !== null) return;

    const correct_index = question.answer_index;
    const correct = optionIndex === correct_index;
    const result: AnswerResult = {
      correct,
      correct_index,
      explanation_vi: correct
        ? "Chính xác! 🎉"
        : `Đáp án đúng là: ${question.options[correct_index]}`,
    };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { selectedIndex: optionIndex, result } : s))
    );
  }

  function handleNext() {
    if (isLast) {
      onFinish(
        quizStates.map((s) => s.result!),
        quizStates.map((s) => s.selectedIndex!)
      );
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Câu {currentIndex + 1} / {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < currentIndex
                  ? "bg-green-400"
                  : i === currentIndex
                  ? "bg-zinc-900"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-zinc-800 leading-relaxed">{question.text}</p>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, oi) => {
          const isSelected = state.selectedIndex === oi;
          const answered = state.result !== null;
          const isCorrect = answered && oi === state.result?.correct_index;
          const isWrong = answered && isSelected && !isCorrect;

          return (
            <button
              key={oi}
              onClick={() => handleAnswer(oi)}
              disabled={answered}
              className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                isCorrect
                  ? "border-green-400 bg-green-50 text-green-800"
                  : isWrong
                  ? "border-red-400 bg-red-50 text-red-800"
                  : isSelected
                  ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white disabled:cursor-default"
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {state.result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            state.result.correct
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {state.result.explanation_vi}
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200">
          {submitError}
        </div>
      )}

      {/* Next / Finish */}
      {state.result && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          {isLast ? "Xem kết quả →" : "Câu tiếp theo →"}
        </button>
      )}
    </div>
  );
}
