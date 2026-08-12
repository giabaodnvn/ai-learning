"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { apiTypeFor, mapApiCard, SESSION_MODE_LABELS } from "@/lib/flashcard-utils";
import type { FlashCard } from "@/lib/flashcard-utils";
import { useFlashcardStore } from "@/lib/stores/flashcardStore";
import type { SessionConfig } from "@/lib/stores/flashcardStore";
import { FlashcardFront } from "./FlashcardFront";
import { FlashcardBack } from "./FlashcardBack";
import { GradeButtons } from "./GradeButtons";
import { SessionSummary } from "./SessionSummary";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { bufferSSE } from "@/lib/sse";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { LoadingCard } from "@/components/shared/LoadingCard";

interface Props {
  config: SessionConfig;
  onBack: () => void;
}

export function FlashcardDeck({ config, onBack }: Props) {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);
  const [gradeError, setGradeError] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const {
    queue,
    currentIndex,
    revealed,
    sessionStats,
    initSession,
    flip,
    recordAndAdvance,
    reset,
  } = useFlashcardStore();

  // Build query params from session config
  const apiType = apiTypeFor(config.mode);
  const queryKey = ["flashcards-session", apiType, config.level ?? "all"];

  // ── Fetch due + new cards in parallel ────────────────────────────────────
  const params = new URLSearchParams({ type: apiType });
  if (config.level) params.set("level", config.level);
  const paramStr = params.toString();

  const dueQuery = useQuery<{ cards: FlashCard[]; total_due: number }>({
    queryKey: [...queryKey, "due"],
    queryFn: async () => {
      const res = await api.get(`/api/v1/flashcards/due?${paramStr}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = res.data as { total_due: number; cards: any[] };
      return { total_due: raw.total_due, cards: raw.cards.map(mapApiCard) };
    },
  });

  const newQuery = useQuery<{ cards: FlashCard[]; total_new: number }>({
    queryKey: [...queryKey, "new"],
    queryFn: async () => {
      const res = await api.get(`/api/v1/flashcards/new?${paramStr}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = res.data as { total_new: number; cards: any[] };
      return { total_new: raw.total_new, cards: raw.cards.map(mapApiCard) };
    },
  });

  const isLoading = dueQuery.isLoading || newQuery.isLoading;
  const error = dueQuery.error ?? newQuery.error;

  // Merge: due cards first, then new cards
  const allCards: FlashCard[] = [
    ...(dueQuery.data?.cards ?? []),
    ...(newQuery.data?.cards ?? []),
  ];
  const totalCards = allCards.length;

  // Init session when both queries resolve and queue is empty (fresh start)
  useEffect(() => {
    if (!dueQuery.isLoading && !newQuery.isLoading && allCards.length > 0 && queue.length === 0) {
      initSession(allCards);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueQuery.isLoading, newQuery.isLoading, totalCards, queue.length]);

  // ── Prefetch AI explain for upcoming vocabulary cards ─────────────────────
  useEffect(() => {
    if (queue.length === 0) return;
    const ctrl = new AbortController();
    const upcoming = queue.slice(currentIndex + 1, currentIndex + 6);
    upcoming
      .filter((c): c is Extract<FlashCard, { cardType: "vocabulary" }> => c.cardType === "vocabulary")
      .forEach((card) => {
        queryClient.prefetchQuery({
          queryKey: ["vocab-explain", card.cardId],
          queryFn: () => bufferSSE(`/api/v1/vocabularies/${card.cardId}/explain`, { signal: ctrl.signal }),
          staleTime: 30 * 60 * 1000,
        });
      });
    // Cancel in-flight prefetch streams when the card advances or the deck unmounts.
    return () => ctrl.abort();
  }, [currentIndex, queue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Grade handler ─────────────────────────────────────────────────────────
  async function handleGrade(grade: number) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setGradeError(false);

    const card = queue[currentIndex];
    try {
      await api.post("/api/v1/flashcards/review", {
        card_type: card.cardType,
        card_id:   card.cardId,
        grade,
      });
    } catch {
      // Staying on the card is the only honest option: the review was not
      // recorded, and advancing would silently drop it (the SRS state lives
      // server-side, so nothing "self-corrects" later).
      setGradeError(true);
      return;
    } finally {
      submittingRef.current = false;
    }

    recordAndAdvance(grade);
  }

  // Refetch first, then clear the queue: `reset()` empties it, which re-arms the
  // init effect above — and if that fires while the refetch is still in flight
  // it re-seeds the session from the cached (already-graded) cards.
  async function handleRestart() {
    setRestarting(true);
    try {
      const results = await Promise.all([dueQuery.refetch(), newQuery.refetch()]);
      if (results.some((r) => r.isError)) return;
      reset();
    } finally {
      setRestarting(false);
    }
  }

  function handleBack() {
    reset();
    onBack();
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LoadingCard />
    );
  }

  if (error) {
    return <ErrorBanner>Không thể tải thẻ ôn tập. Vui lòng thử lại.</ErrorBanner>;
  }

  // ── Session complete / no cards ───────────────────────────────────────────
  const isDone = currentIndex >= queue.length;

  if (isDone || (!isLoading && totalCards === 0)) {
    if (sessionStats.grades.length > 0) {
      return <SessionSummary onRestart={handleRestart} onBack={handleBack} />;
    }
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-3">
        <p className="text-4xl">🎉</p>
        <p className="font-bold text-zinc-900">Không có thẻ nào hôm nay!</p>
        <p className="text-sm text-zinc-500">
          Tất cả thẻ đã học — hãy quay lại vào ngày mai.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleBack}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  // ── Active card ───────────────────────────────────────────────────────────
  const card = queue[currentIndex];
  const progress = (currentIndex / queue.length) * 100;

  const modeLabel = SESSION_MODE_LABELS[config.mode];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Đổi chế độ
        </button>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
          {modeLabel}{config.level ? ` · ${config.level.toUpperCase()}` : ""}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{currentIndex + 1} / {queue.length} thẻ</span>
        <span>{queue.length - currentIndex - 1} còn lại</span>
      </div>
      <ProgressBar percent={progress} />

      {/* Front / Back */}
      {!revealed ? (
        <FlashcardFront card={card} onFlip={flip} />
      ) : (
        <FlashcardBack card={card} />
      )}

      {/* Grade buttons (after reveal) */}
      {revealed && (
        <>
          <GradeButtons cardType={card.cardType} onGrade={handleGrade} />
          {gradeError && (
            <ErrorBanner>Không lưu được kết quả. Vui lòng chọn lại mức độ.</ErrorBanner>
          )}
        </>
      )}

      {/* Flip button (before reveal) */}
      {!revealed && (
        <button
          onClick={flip}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Xem đáp án
        </button>
      )}
    </div>
  );
}
