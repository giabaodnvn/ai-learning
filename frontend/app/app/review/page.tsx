"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ReviewCard {
  id: number;
  vocabulary: {
    id: number;
    word: string;
    reading: string;
    meaning_vi: string;
    part_of_speech: string;
    jlpt_level: string;
  };
  due_date: string;
  repetitions: number;
  interval: number;
  ease_factor: number;
}

interface ReviewQueue {
  cards: ReviewCard[];
  total_due: number;
}

const RATINGS = [
  { quality: 0, label: "Quên",   color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
  { quality: 3, label: "Khó",    color: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { quality: 4, label: "Ổn",     color: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { quality: 5, label: "Dễ",     color: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" },
];

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
    },
  });

  const cards = data?.cards ?? [];
  const current = cards[currentIndex];

  async function handleRate(quality: number) {
    if (!current) return;

    await submitMutation.mutateAsync({ progressId: current.id, quality });

    setSessionResults((prev) => [...prev, { quality }]);
    setRevealed(false);

    if (currentIndex + 1 >= cards.length) {
      setDone(true);
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
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-zinc-900">Luyện tập SRS</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tải thẻ ôn tập. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  if (cards.length === 0 || done) {
    const correct = sessionResults.filter((r) => r.quality >= 4).length;
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
          {current.vocabulary.jlpt_level.toUpperCase()}
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
          {current.vocabulary.word}
        </p>

        {!revealed ? (
          <p className="text-sm text-zinc-400 mt-4">Nhấn để xem đáp án</p>
        ) : (
          <div className="space-y-2 mt-2">
            <p className="text-lg text-zinc-600">
              {current.vocabulary.reading}
            </p>
            <p className="text-xl font-semibold text-zinc-800">
              {current.vocabulary.meaning_vi}
            </p>
            {current.vocabulary.part_of_speech && (
              <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {current.vocabulary.part_of_speech}
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
