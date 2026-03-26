"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  useFlashcardStore,
  type ReviewCard,
} from "@/lib/stores/flashcardStore";
import { FlashcardFront } from "./FlashcardFront";
import { FlashcardBack } from "./FlashcardBack";
import { GradeButtons } from "./GradeButtons";
import { SessionSummary } from "./SessionSummary";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// Buffer a full SSE explain stream into a string (used for background prefetch).
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
      try {
        payload = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (payload.error || payload.done) break outer;
      result += payload.delta ?? "";
    }
  }

  return result;
}

export function FlashcardDeck() {
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

  // ── Fetch due cards ───────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useQuery<{
    cards: ReviewCard[];
    total_due: number;
  }>({
    queryKey: ["flashcards-due"],
    queryFn: async () => {
      const res = await api.get("/api/v1/flashcards/due");
      return res.data;
    },
  });

  // Init session when data arrives (only when queue is empty = fresh start)
  useEffect(() => {
    if (data?.cards && data.cards.length > 0 && queue.length === 0) {
      initSession(data.cards);
    }
  }, [data, queue.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prefetch AI explain for next 5 cards ─────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken || queue.length === 0) return;

    const upcoming = queue.slice(currentIndex + 1, currentIndex + 6);
    upcoming.forEach((card) => {
      queryClient.prefetchQuery({
        queryKey: ["vocab-explain", card.vocabulary.id],
        queryFn: () =>
          fetchVocabExplainBuffered(card.vocabulary.id, session.accessToken),
        staleTime: 30 * 60 * 1000, // 30 min — matches Redis TTL
      });
    });
  }, [currentIndex, queue, session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Grade handler ─────────────────────────────────────────────────────────
  async function handleGrade(grade: number) {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const card = queue[currentIndex];
    try {
      await api.post(`/api/v1/flashcards/${card.vocabulary.id}/review`, {
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
    refetch();
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

  if (isDone || (data && data.cards.length === 0)) {
    if (sessionStats.grades.length > 0) {
      return <SessionSummary onRestart={handleRestart} />;
    }
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-3">
        <p className="text-4xl">🎉</p>
        <p className="font-bold text-zinc-900">Không có thẻ nào cần ôn hôm nay!</p>
        <p className="text-sm text-zinc-500">
          Tổng số thẻ đến hạn: {data?.total_due ?? 0}
        </p>
        <button
          onClick={handleRestart}
          className="mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Tải lại
        </button>
      </div>
    );
  }

  // ── Active card ───────────────────────────────────────────────────────────
  const card = queue[currentIndex];
  const progress = (currentIndex / queue.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {currentIndex + 1} / {queue.length} thẻ
        </span>
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
        <FlashcardFront vocabulary={card.vocabulary} onFlip={flip} />
      ) : (
        <FlashcardBack card={card} />
      )}

      {/* Grade buttons (after reveal) */}
      {revealed && <GradeButtons onGrade={handleGrade} />}

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
