"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { GRADE_COLORS } from "@/lib/flashcard-utils";
import { LoadingCard } from "@/components/shared/LoadingCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { cardDisplay, ReviewCardFace, type ReviewCard } from "@/components/review/ReviewCard";

interface ReviewQueue {
  cards: ReviewCard[];
  total_due: number;
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
        <PageHeader title="Luyện tập SRS" description="Đang tải thẻ ôn tập..." />
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Luyện tập SRS" />
        <ErrorBanner>
          Không thể tải thẻ ôn tập. Vui lòng thử lại.
        </ErrorBanner>
      </div>
    );
  }

  if (cards.length === 0 || done || !current) {
    return (
      <div className="space-y-6">
        <PageHeader title="Luyện tập SRS" />
        <ReviewSummary
          qualities={sessionResults.map((r) => r.quality)}
          nothingDue={cards.length === 0 && !done}
          totalDue={data?.total_due ?? 0}
          onRestart={() => {
            setCurrentIndex(0);
            setRevealed(false);
            setSessionResults([]);
            setDone(false);
            queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
          }}
        />
      </div>
    );
  }

  const progress = (currentIndex / cards.length) * 100;

  const display = cardDisplay(current);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Luyện tập SRS"
        description={`${currentIndex + 1} / ${cards.length} thẻ`}
        right={
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {display.jlpt_level.toUpperCase()}
          </span>
        }
      />

      <ProgressBar percent={progress} />

      <ReviewCardFace display={display} revealed={revealed} onReveal={() => setRevealed(true)} />

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
