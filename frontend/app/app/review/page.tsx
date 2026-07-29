"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { GRADE_COLORS } from "@/lib/flashcard-utils";
import { LoadingCard } from "@/components/shared/LoadingCard";

interface ReviewCard {
  id: number;
  card_type: "vocabulary" | "kanji" | "grammar_point";
  due_date: string;
  repetitions: number;
  interval: number;
  ease_factor: number;
  // Content fields depending on card_type:
  vocabulary?: {
    id: number;
    word: string;
    reading: string;
    meaning_vi: string;
    part_of_speech: string;
    jlpt_level: string;
  };
  kanji?: {
    id: number;
    character: string;
    reading_on: string;
    meaning_vi: string;
    jlpt_level: string;
  };
  grammar_point?: {
    id: number;
    pattern: string;
    explanation_vi: string;
    jlpt_level: string;
  };
}

interface ReviewQueue {
  cards: ReviewCard[];
  total_due: number;
}

function cardDisplay(card: ReviewCard) {
  if (card.card_type === "kanji" && card.kanji) {
    return {
      front: card.kanji.character,
      reading: card.kanji.reading_on,
      meaning_vi: card.kanji.meaning_vi,
      tag: "Kanji",
      jlpt_level: card.kanji.jlpt_level,
    };
  }
  if (card.card_type === "grammar_point" && card.grammar_point) {
    return {
      front: card.grammar_point.pattern,
      reading: null as string | null,
      meaning_vi: card.grammar_point.explanation_vi,
      tag: "Ngữ pháp",
      jlpt_level: card.grammar_point.jlpt_level,
    };
  }
  return {
    front: card.vocabulary?.word ?? "",
    reading: card.vocabulary?.reading ?? "",
    meaning_vi: card.vocabulary?.meaning_vi ?? "",
    tag: card.vocabulary?.part_of_speech ?? null as string | null,
    jlpt_level: card.vocabulary?.jlpt_level ?? "",
  };
}

// This screen posts the 0/3/4/5 quality scale the review endpoint expects;
// the colours come from the shared per-grade palette so the buttons match the
// flashcard deck's.
const RATINGS = [
  { quality: 0, label: "Quên" },
  { quality: 3, label: "Khó" },
  { quality: 4, label: "Ổn" },
  { quality: 5, label: "Dễ" },
].map((r, grade) => ({ ...r, color: GRADE_COLORS[grade] }));

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ quality: number }[]>([]);
  const [done, setDone] = useState(false);

  const { data, isLoading, error } = useQuery<ReviewQueue>({
    queryKey: ["reviewQueue"],
    queryFn: async () => {
      const res = await api.get("/api/v1/review/queue");
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      progressId,
      quality,
    }: {
      progressId: number;
      quality: number;
    }) => {
      await api.post("/api/v1/review/submit", {
        progress_id: progressId,
        quality,
      });
    },
  });

  const cards = data?.cards ?? [];
  const current = cards[currentIndex];

  async function handleRate(quality: number) {
    if (!current) return;

    try {
      await submitMutation.mutateAsync({ progressId: current.id, quality });
    } catch {
      // Keep the current card so the user can retry; the failure is surfaced
      // via submitMutation.isError below instead of an unhandled rejection.
      return;
    }

    setSessionResults((prev) => [...prev, { quality }]);
    setRevealed(false);

    if (currentIndex + 1 >= cards.length) {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Luyện tập SRS</h1>
          <p className="mt-1 text-sm text-zinc-500">Đang tải thẻ ôn tập...</p>
        </div>
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-zinc-900">Luyện tập SRS</h1>
        <ErrorBanner>
          Không thể tải thẻ ôn tập. Vui lòng thử lại.
        </ErrorBanner>
      </div>
    );
  }

  if (cards.length === 0 || done || !current) {
    const correct = sessionResults.filter((r) => r.quality >= 3).length;
    const total = sessionResults.length;

    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-zinc-900">Luyện tập SRS</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-4">
          <p className="text-4xl">
            {cards.length === 0 && !done ? "🎉" : total > 0 && correct / total >= 0.8 ? "🏆" : "💪"}
          </p>
          {cards.length === 0 && !done ? (
            <>
              <p className="text-lg font-bold text-zinc-900">
                Không có thẻ nào cần ôn hôm nay!
              </p>
              <p className="text-sm text-zinc-500">Quay lại sau nhé.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-zinc-900">Hoàn thành phiên ôn tập!</p>
              <p className="text-sm text-zinc-500">
                Đúng {correct}/{total} thẻ ({total > 0 ? Math.round((correct / total) * 100) : 0}%)
              </p>
              {(data?.total_due ?? 0) > total && (
                <p className="text-sm text-amber-600 font-medium">
                  Còn {(data?.total_due ?? 0) - total} thẻ đến hạn — nhấn &quot;Tiếp tục&quot; để ôn thêm.
                </p>
              )}
            </>
          )}
          <button
            onClick={() => {
              setCurrentIndex(0);
              setRevealed(false);
              setSessionResults([]);
              setDone(false);
              queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {(data?.total_due ?? 0) > sessionResults.length ? "Tiếp tục ôn tập" : "Tải lại"}
          </button>
        </div>
      </div>
    );
  }

  const progress = (currentIndex / cards.length) * 100;

  const display = cardDisplay(current);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Luyện tập SRS</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {currentIndex + 1} / {cards.length} thẻ
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {display.jlpt_level.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="rounded-2xl border border-zinc-200 bg-white p-10 text-center cursor-pointer min-h-[220px] flex flex-col items-center justify-center gap-4 select-none hover:border-zinc-300 transition-colors"
        onClick={() => !revealed && setRevealed(true)}
      >
        <p className="text-5xl font-bold text-zinc-900">
          {display.front}
        </p>

        {!revealed ? (
          <p className="text-sm text-zinc-400 mt-4">Nhấn để xem đáp án</p>
        ) : (
          <div className="space-y-2 mt-2">
            {display.reading && (
              <p className="text-lg text-zinc-600">{display.reading}</p>
            )}
            <p className="text-xl font-semibold text-zinc-800">
              {display.meaning_vi}
            </p>
            {display.tag && (
              <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {display.tag}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div>
          <p className="text-xs text-center text-zinc-500 mb-3">
            Bạn nhớ từ này ở mức nào?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.quality}
                onClick={() => handleRate(r.quality)}
                disabled={submitMutation.isPending}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${r.color}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {submitMutation.isError && (
            <p className="text-xs text-center text-red-600 mt-2">
              Không lưu được kết quả. Vui lòng thử lại.
            </p>
          )}
          <p className="text-xs text-center text-zinc-400 mt-2">
            Lần ôn #{current.repetitions + 1} · Interval hiện tại: {current.interval} ngày
          </p>
        </div>
      )}

      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Xem đáp án
        </button>
      )}
    </div>
  );
}
