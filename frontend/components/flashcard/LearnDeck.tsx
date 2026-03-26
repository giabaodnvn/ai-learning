"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mapRandomCard } from "@/lib/flashcard-utils";
import type { LearnConfig, RandomCard } from "@/lib/flashcard-utils";
import { FlashcardFront } from "./FlashcardFront";
import { FlashcardBack } from "./FlashcardBack";

interface Props {
  config: LearnConfig;
  onFinish: (cards: RandomCard[]) => void;
  onBack: () => void;
}

export function LearnDeck({ config, onFinish, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const { data, isLoading, error } = useQuery<{ cards: RandomCard[] }>({
    queryKey: ["flashcards-random", config],
    queryFn: async () => {
      const params = new URLSearchParams({
        level:   config.level,
        vocab:   String(config.vocabCount),
        kanji:   String(config.kanjiCount),
        grammar: String(config.grammarCount),
      });
      const res = await api.get(`/api/v1/flashcards/random?${params}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { cards: (res.data.cards as any[]).map(mapRandomCard) };
    },
    staleTime: 0,    // always re-randomise
    gcTime: 0,
  });

  const cards = data?.cards ?? [];
  const total = cards.length;
  const progress = total > 0 ? (index / total) * 100 : 0;

  // Auto-advance when all cards are seen
  useEffect(() => {
    if (!isLoading && total > 0 && index >= total) {
      onFinish(cards);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total, isLoading]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
      </div>
    );
  }

  if (error || total === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-3">
        <p className="text-4xl">😕</p>
        <p className="font-bold text-zinc-900">Không tìm thấy thẻ nào cho trình độ {config.level.toUpperCase()}</p>
        <button onClick={onBack} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
          Quay lại
        </button>
      </div>
    );
  }

  const card = cards[index];

  // Guard: index has passed the last card but effect hasn't fired yet
  if (!card) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Quay lại
        </button>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          Giai đoạn 1 / 2 — Xem thẻ
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{index + 1} / {total} thẻ</span>
        <span>{total - index - 1} còn lại</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      {!revealed ? (
        <FlashcardFront card={card} onFlip={() => setRevealed(true)} />
      ) : (
        <FlashcardBack card={card} />
      )}

      {/* Learned badge on card (show if already learned) */}
      {card.learned && (
        <p className="text-center text-xs text-green-600 font-medium">
          ✓ Bạn đã thuộc thẻ này trước đó
        </p>
      )}

      {/* Actions */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Xem nội dung
        </button>
      ) : (
        <button
          onClick={() => { setRevealed(false); setIndex((i) => i + 1); }}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          {index + 1 < total ? "Đã xem, tiếp theo →" : "Xong! Bắt đầu kiểm tra →"}
        </button>
      )}
    </div>
  );
}
