"use client";

import type { ExerciseData } from "./ExerciseCard";
import type { AnswerResult } from "@/types/quiz";
import { QuizResultCard } from "@/components/shared/QuizResultCard";

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
  onListenAgain,
  onNewExercise,
}: Props) {
  const questions = exercise.questions.map((q) => ({
    text: q.question_ja,
    options: q.options,
  }));

  return (
    <QuizResultCard
      questions={questions}
      results={results}
      primaryLabel="Bài mới"
      onPrimary={onNewExercise}
      secondaryLabel="Nghe lại"
      onSecondary={onListenAgain}
      perfectionMessage={{
        title: "Tuyệt vời! Bạn đã hoàn toàn hiểu bài! 🌟",
        subtitle: "Hãy tiếp tục luyện nghe để cải thiện kỹ năng của mình.",
      }}
    />
  );
}
