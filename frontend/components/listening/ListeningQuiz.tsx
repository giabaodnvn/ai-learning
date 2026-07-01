"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { ExerciseData } from "./ExerciseCard";
import type { AnswerResult } from "@/types/quiz";
import { QuizPlayer } from "@/components/shared/QuizPlayer";

interface Props {
  exercise: ExerciseData;
  speechRate: number;
  onFinish: (results: AnswerResult[], score: number, total: number) => void;
}

export function ListeningQuiz({ exercise, speechRate, onFinish }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = exercise.questions.map((q) => ({
    text: q.question_ja,
    options: q.options,
    answer_index: q.correct_index,
  }));

  async function handleFinish(results: AnswerResult[], selectedIndices: number[]) {
    setSubmitError(null);
    const answers = selectedIndices.map((answer_index, question_index) => ({
      question_index,
      answer_index,
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

  return (
    <QuizPlayer
      questions={questions}
      onFinish={handleFinish}
      submitError={submitError}
    />
  );
}
