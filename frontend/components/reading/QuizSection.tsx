"use client";

import type { PassageData } from "./PassageCard";
import type { AnswerResult } from "@/types/quiz";
import { QuizPlayer } from "@/components/shared/QuizPlayer";

interface Props {
  passage: PassageData;
  onFinish: (answers: AnswerResult[]) => void;
}

export function QuizSection({ passage, onFinish }: Props) {
  const questions = passage.questions.map((q) => ({
    text: q.question,
    options: q.options,
    answer_index: q.answer_index,
  }));

  return (
    <QuizPlayer
      questions={questions}
      onFinish={(results) => onFinish(results)}
    />
  );
}
