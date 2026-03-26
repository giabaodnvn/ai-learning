"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mapApiCard } from "@/lib/flashcard-utils";
import type { FlashCard } from "@/lib/flashcard-utils";
import { useFlashcardStore } from "@/lib/stores/flashcardStore";
import type { SessionConfig } from "@/lib/stores/flashcardStore";
import { FlashcardFront } from "./FlashcardFront";
import { FlashcardBack } from "./FlashcardBack";
import { GradeButtons } from "./GradeButtons";
import { SessionSummary } from "./SessionSummary";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// Background prefetch: buffer a vocabulary SSE explain stream.
async function fetchVocabExplainBuffered(
  vocabId: number,
  token: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/vocabularies/${vocabId}/explain`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.body) return "";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      let payload: { delta?: string; done?: boolean; error?: string };
      try { payload = JSON.parse(line.slice(6)); } catch { continue; }
      if (payload.error || payload.done) break outer;
      result += payload.delta ?? "";
    }
  }
  return result;
}

interface Props {
  config: SessionConfig;
  onBack: () => void;
}

export function FlashcardDeck({ config, onBack }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);

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
  const apiType = config.mode === "daily" ? "all" : config.mode;
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

  function refetch() {
    dueQuery.refetch();
    newQuery.refetch();
  }

  // Init session when both queries resolve and queue is empty (fresh start)
  useEffect(() => {
    if (!dueQuery.isLoading && !newQuery.isLoading && allCards.length > 0 && queue.length === 0) {
      initSession(allCards);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueQuery.isLoading, newQuery.isLoading, totalCards, queue.length]);

  // ── Prefetch AI explain for upcoming vocabulary cards ─────────────────────
  useEffect(() => {
    if (!session?.accessToken || queue.length === 0) return;
    const upcoming = queue.slice(currentIndex + 1, currentIndex + 6);
    upcoming
      .filter((c): c is Extract<FlashCard, { cardType: "vocabulary" }> => c.cardType === "vocabulary")
      .forEach((card) => {
        queryClient.prefetchQuery({
          queryKey: ["vocab-explain", card.cardId],
          queryFn: () => fetchVocabExplainBuffered(card.cardId, session.accessToken),
          staleTime: 30 * 60 * 1000,
        });
      });
  }, [currentIndex, queue, session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Grade handler ─────────────────────────────────────────────────────────
  async function handleGrade(grade: number) {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const card = queue[currentIndex];
    try {
      await api.post("/api/v1/flashcards/review", {
        card_type: card.cardType,
        card_id:   card.cardId,
        grade,
      });
    } catch {
      // Continue session even on network failure; server will self-correct next session
    } finally {
      submittingRef.current = false;
    }

    recordAndAdvance(grade);
  }

  function handleRestart() {
    reset();
    queryClient.invalidateQueries({ queryKey });
    refetch();
  }

  function handleBack() {
    reset();
    onBack();
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Không thể tải thẻ ôn tập. Vui lòng thử lại.
      </div>
    );
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
            onClick={() => { reset(); refetch(); }}
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

  const modeLabel =
    config.mode === "daily"         ? "Hằng ngày" :
    config.mode === "vocabulary"    ? "Từ vựng" :
    config.mode === "kanji"         ? "Kanji" :
    "Ngữ pháp";

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
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Front / Back */}
      {!revealed ? (
        <FlashcardFront card={card} onFlip={flip} />
      ) : (
        <FlashcardBack card={card} />
      )}

      {/* Grade buttons (after reveal) */}
      {revealed && <GradeButtons cardType={card.cardType} onGrade={handleGrade} />}

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
