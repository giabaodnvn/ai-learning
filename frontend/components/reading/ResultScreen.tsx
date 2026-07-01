"use client";

import type { PassageData } from "./PassageCard";
import type { AnswerResult } from "@/types/quiz";
import { QuizResultCard } from "@/components/shared/QuizResultCard";

interface Props {
  passage: PassageData;
  results: AnswerResult[];
  onReadAgain: () => void;
  onNewPassage: () => void;
}

export function ResultScreen({ passage, results, onReadAgain, onNewPassage }: Props) {
  const questions = passage.questions.map((q) => ({
    text: q.question,
    options: q.options,
  }));

  return (
    <QuizResultCard
      questions={questions}
      results={results}
      primaryLabel="Bài mới"
      onPrimary={onNewPassage}
      secondaryLabel="Đọc lại"
      onSecondary={onReadAgain}
    />
  );
}
