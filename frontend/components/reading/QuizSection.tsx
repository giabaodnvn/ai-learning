"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import type { PassageData, Question } from "./PassageCard";

interface AnswerResult {
  correct: boolean;
  correct_index: number;
  explanation_vi: string;
}

interface QuizState {
  selectedIndex: number | null;
  result: AnswerResult | null;
  loading: boolean;
}

interface Props {
  passage: PassageData;
  onFinish: (answers: AnswerResult[]) => void;
}

/**
 * Shows one question at a time. User picks an option, sees feedback,
 * then advances to the next question.
 */
export function QuizSection({ passage, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStates,   setQuizStates]   = useState<QuizState[]>(
    passage.questions.map(() => ({ selectedIndex: null, result: null, loading: false }))
  );
  const [allResults, setAllResults]     = useState<AnswerResult[]>([]);

  const question: Question | undefined = passage.questions[currentIndex];
  const state  = quizStates[currentIndex];
  const isLast = currentIndex === passage.questions.length - 1;

  async function handleAnswer(optionIndex: number) {
    if (state.selectedIndex !== null || state.loading) return;

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, selectedIndex: optionIndex, loading: true } : s))
    );

    try {
      const res = await api.post(`/api/v1/reading_passages/${passage.id}/answer`, {
        question_index: currentIndex,
        answer_index:   optionIndex,
      });
      const result: AnswerResult = res.data;

      setQuizStates((prev) =>
        prev.map((s, i) => (i === currentIndex ? { ...s, result, loading: false } : s))
      );
      setAllResults((prev) => {
        const next = [...prev];
        next[currentIndex] = result;
        return next;
      });
    } catch {
      setQuizStates((prev) =>
        prev.map((s, i) => (i === currentIndex ? { ...s, loading: false } : s))
      );
    }
  }

  function handleNext() {
    if (isLast) {
      onFinish(allResults);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Câu {currentIndex + 1} / {passage.questions.length}</span>
        <div className="flex gap-1">
          {passage.questions.map((_, i) => (
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
      <p className="text-sm font-medium text-zinc-800 leading-relaxed">
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, oi) => {
          const isSelected = state.selectedIndex === oi;
          const answered   = state.result !== null;
          const isCorrect  = answered && oi === state.result!.correct_index;
          const isWrong    = answered && isSelected && !isCorrect;

          return (
            <button
              key={oi}
              onClick={() => handleAnswer(oi)}
              disabled={answered || state.loading}
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

      {/* Next / Finish */}
      {state.result && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          {isLast ? "Xem kết quả" : "Câu tiếp theo →"}
        </button>
      )}
    </div>
  );
}
