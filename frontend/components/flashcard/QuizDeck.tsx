"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RandomCard, QuizQuestion as QuizQuestionType, QuizResult } from "@/lib/flashcard-utils";
import { QuizQuestion } from "./QuizQuestion";

interface Props {
  cards: RandomCard[];
  onFinish: () => void;
  onBack: () => void;
}

interface QuizSummaryProps {
  results: QuizResult[];
  onRetry: () => void;
  onBack: () => void;
}

function QuizSummary({ results, onRetry, onBack }: QuizSummaryProps) {
  const total   = results.length;
  const correct = results.filter((r) => r.learned).length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;

  const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-5">
      <p className="text-5xl">{emoji}</p>
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Kết quả kiểm tra</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {correct}/{total} câu đúng ({pct}%)
        </p>
      </div>

      {/* Breakdown by type */}
      {(["vocabulary", "kanji", "grammar_point"] as const).map((ct) => {
        const subset = results.filter((r) => r.cardType === ct);
        if (subset.length === 0) return null;
        const ok = subset.filter((r) => r.learned).length;
        const label = ct === "vocabulary" ? "Từ vựng" : ct === "kanji" ? "Kanji" : "Ngữ pháp";
        return (
          <div key={ct} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5 text-sm">
            <span className="text-zinc-600">{label}</span>
            <span className={`font-semibold ${ok === subset.length ? "text-green-700" : "text-zinc-800"}`}>
              {ok}/{subset.length}
            </span>
          </div>
        );
      })}

      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 text-left">
        Trạng thái "Đã thuộc / Chưa thuộc" đã được cập nhật dựa trên kết quả kiểm tra.
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={onRetry}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Học lại
        </button>
      </div>
    </div>
  );
}

export function QuizDeck({ cards, onFinish, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  // Fetch quiz questions
  const { data: quizData, isLoading, error } = useQuery<{ questions: QuizQuestionType[] }>({
    queryKey: ["quiz-questions", cards.map((c) => `${c.cardType}:${c.cardId}`).join(",")],
    queryFn: async () => {
      const res = await api.post("/api/v1/flashcards/quiz", {
        cards: cards.map((c) => ({ card_type: c.cardType, card_id: c.cardId })),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qs = res.data.questions as any[];
      return {
        questions: qs.map((q) => ({
          cardType:     q.card_type,
          cardId:       q.card_id,
          question:     q.question,
          questionHint: q.question_hint ?? null,
          options:      q.options,
          correct:      q.correct,
        })),
      };
    },
    staleTime: Infinity,
  });

  // Bulk status update after quiz
  const statusMutation = useMutation({
    mutationFn: async (results: QuizResult[]) => {
      await api.post("/api/v1/flashcards/status/bulk", {
        results: results.map((r) => ({
          card_type: r.cardType,
          card_id:   r.cardId,
          learned:   r.learned,
        })),
      });
    },
  });

  const questions = quizData?.questions ?? [];

  function handleAnswer(correct: boolean) {
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    if (index + 1 >= questions.length) {
      // Quiz done — build results and save
      const results: QuizResult[] = questions.map((q, i) => ({
        cardType: q.cardType,
        cardId:   q.cardId,
        learned:  newAnswers[i] ?? false,
      }));
      statusMutation.mutate(results);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
        <p className="text-xs text-zinc-400">Đang tạo bài kiểm tra...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-3">
        <p className="text-4xl">😕</p>
        <p className="text-sm text-zinc-600">Không thể tạo bài kiểm tra. Vui lòng thử lại.</p>
        <button onClick={onBack} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
          Quay lại
        </button>
      </div>
    );
  }

  if (finished) {
    const results: QuizResult[] = questions.map((q, i) => ({
      cardType: q.cardType,
      cardId:   q.cardId,
      learned:  answers[i] ?? false,
    }));
    return (
      <QuizSummary
        results={results}
        onRetry={onFinish}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Phase label */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Quay lại
        </button>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          Giai đoạn 2 / 2 — Kiểm tra
        </span>
      </div>

      <QuizQuestion
        key={index}
        question={questions[index]}
        index={index}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
