"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import type { ExerciseData } from "./ExerciseCard";
import type { AnswerResult } from "@/types/quiz";

interface QuizState {
  selectedIndex: number | null;
  result: AnswerResult | null;
  loading: boolean;
}

interface Props {
  exercise: ExerciseData;
  speechRate: number;
  onFinish: (results: AnswerResult[], score: number, total: number) => void;
}

export function ListeningQuiz({ exercise, speechRate, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStates, setQuizStates] = useState<QuizState[]>(
    exercise.questions.map(() => ({ selectedIndex: null, result: null, loading: false }))
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const question = exercise.questions[currentIndex];
  const state = quizStates[currentIndex];
  const isLast = currentIndex === exercise.questions.length - 1;
  const allAnswered = quizStates.every((s) => s.result !== null);

  async function handleFinishQuiz() {
    setSubmitError(null);

    // Prepare all answers
    const answers = quizStates.map((s, i) => ({
      question_index: i,
      answer_index: s.selectedIndex ?? 0, // should not be null if allAnswered is true
    }));

    try {
      const res = await api.post(`/api/v1/listening_exercises/${exercise.id}/submit`, {
        answers,
        speech_rate: speechRate,
      });

      onFinish(res.data.results, res.data.score, res.data.total);
    } catch {
      setSubmitError("Không thể nộp bài. Vui lòng thử lại.");
    }
  }

  async function handleAnswer(optionIndex: number) {
    if (state.selectedIndex !== null || state.loading) return;

    setQuizStates((prev) =>
      prev.map((s, i) =>
        i === currentIndex ? { ...s, selectedIndex: optionIndex, loading: true } : s
      )
    );

    // Validate answer client-side (optional - server will do final validation)
    const answer_index = optionIndex;
    const question_index = currentIndex;
    const correct_index = question.correct_index;
    const correct = answer_index === correct_index;
    const correct_option = question.options[correct_index];

    const result: AnswerResult = {
      correct: correct,
      correct_index: correct_index,
      explanation_vi: correct
        ? "Chính xác! 🎉"
        : `Đáp án đúng là: ${correct_option}`,
    };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, result, loading: false } : s))
    );
  }

  function handleNext() {
    if (isLast) {
      handleFinishQuiz();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Câu {currentIndex + 1} / {exercise.questions.length}</span>
        <div className="flex gap-1">
          {exercise.questions.map((_, i) => (
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
        {question.question_ja}
      </p>

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

      {/* Error message */}
      {submitError && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200">
          {submitError}
        </div>
      )}

      {/* Next / Finish */}
      {state.result && (
        <button
          onClick={handleNext}
          disabled={state.loading}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isLast ? "Xem kết quả →" : "Câu tiếp theo →"}
        </button>
      )}
    </div>
  );
}
