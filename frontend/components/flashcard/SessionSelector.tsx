"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { apiTypeFor, SESSION_MODE_LABELS, type SessionMode } from "@/lib/flashcard-utils";
import type { SessionConfig } from "@/lib/stores/flashcardStore";
import { JLPT_LEVELS } from "@/types/quiz";

interface Props {
  onStart: (config: SessionConfig) => void;
}

// Only what is specific to this picker. The Vietnamese name and the API `type`
// are derived from the mode, so they cannot drift from the deck's.
const MODES: {
  mode: SessionMode;
  desc: string;
  icon: string;
  gradient: string;
  selectedBorder: string;
  selectedBg: string;
  countClass: string;
}[] = [
  {
    mode: "daily",
    desc: "Tất cả loại thẻ",
    icon: "📅",
    gradient: "from-indigo-500 to-indigo-400",
    selectedBorder: "border-indigo-400",
    selectedBg: "bg-indigo-50",
    countClass: "bg-indigo-100 text-indigo-700",
  },
  {
    mode: "vocabulary",
    desc: "Chỉ từ vựng",
    icon: "📝",
    gradient: "from-blue-500 to-sky-400",
    selectedBorder: "border-blue-400",
    selectedBg: "bg-blue-50",
    countClass: "bg-blue-100 text-blue-700",
  },
  {
    mode: "kanji",
    desc: "Chỉ chữ Hán",
    icon: "漢",
    gradient: "from-rose-500 to-orange-400",
    selectedBorder: "border-rose-400",
    selectedBg: "bg-rose-50",
    countClass: "bg-rose-100 text-rose-700",
  },
  {
    mode: "grammar_point",
    desc: "Chỉ ngữ pháp",
    icon: "✏️",
    gradient: "from-violet-500 to-purple-400",
    selectedBorder: "border-violet-400",
    selectedBg: "bg-violet-50",
    countClass: "bg-violet-100 text-violet-700",
  },
];

function useCardCounts(apiType: string, level?: string) {
  const params = new URLSearchParams({ type: apiType });
  if (level) params.set("level", level);
  const paramStr = params.toString();

  const due = useQuery<{ total_due: number }>({
    queryKey: ["flashcards-due-count", apiType, level ?? "all"],
    queryFn: async () => {
      const res = await api.get(`/api/v1/flashcards/due?${paramStr}`);
      return { total_due: res.data.total_due as number };
    },
    staleTime: 60_000,
  });
  const newCards = useQuery<{ total_new: number }>({
    queryKey: ["flashcards-new-count", apiType, level ?? "all"],
    queryFn: async () => {
      const res = await api.get(`/api/v1/flashcards/new?${paramStr}`);
      return { total_new: res.data.total_new as number };
    },
    staleTime: 60_000,
  });

  return {
    due: due.data?.total_due ?? 0,
    newCount: newCards.data?.total_new ?? 0,
    total: (due.data?.total_due ?? 0) + (newCards.data?.total_new ?? 0),
    loading: due.isLoading || newCards.isLoading,
  };
}

function ModeCard({
  mode, desc, icon,
  gradient, selectedBorder, selectedBg, countClass,
  selected, level, onSelect,
}: (typeof MODES)[number] & { selected: boolean; level?: string; onSelect: () => void }) {
  const { due, newCount, total, loading } = useCardCounts(apiTypeFor(mode), level);
  const label = SESSION_MODE_LABELS[mode];

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl border-2 overflow-hidden text-left transition-all duration-200 ${
        selected ? `${selectedBorder} ${selectedBg} shadow-sm` : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
      }`}
    >
      {/* Gradient top bar */}
      <div className={`h-1 bg-gradient-to-r ${gradient} ${selected ? "opacity-100" : "opacity-40"} transition-opacity`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-1 mb-3">
          <span className={`text-2xl leading-none ${icon === "漢" ? "font-black" : ""}`}>{icon}</span>
          {loading ? (
            <span className="h-4 w-8 animate-pulse rounded-full bg-stone-200" />
          ) : total > 0 ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${countClass}`}>{total}</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-400">✓</span>
          )}
        </div>
        <p className={`text-sm font-bold leading-tight ${selected ? "text-zinc-900" : "text-zinc-700"}`}>{label}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{desc}</p>
        {!loading && total > 0 && (
          <p className="mt-2 text-xs">
            {due > 0 && <span className="text-amber-600">{due} ôn</span>}
            {due > 0 && newCount > 0 && <span className="text-zinc-300 mx-1">·</span>}
            {newCount > 0 && <span className="text-emerald-600">{newCount} mới</span>}
          </p>
        )}
      </div>
    </button>
  );
}

export function SessionSelector({ onStart }: Props) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>("daily");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const level = selectedLevel || undefined;
  const { total } = useCardCounts(apiTypeFor(selectedMode), level);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-zinc-800">Chọn chế độ học</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Mỗi phiên gồm thẻ cần ôn hôm nay + thẻ mới chưa học</p>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MODES.map((m) => (
          <ModeCard
            key={m.mode}
            {...m}
            selected={selectedMode === m.mode}
            level={level}
            onSelect={() => setSelectedMode(m.mode)}
          />
        ))}
      </div>

      {/* Level filter */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 mb-2.5 uppercase tracking-wide">Lọc theo trình độ</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLevel("")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedLevel === ""
                ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                : "border-stone-200 bg-white text-zinc-600 hover:border-stone-300"
            }`}
          >
            Tất cả
          </button>
          {JLPT_LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setSelectedLevel(lv)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedLevel === lv
                  ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                  : "border-stone-200 bg-white text-zinc-600 hover:border-stone-300"
              }`}
            >
              {lv.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart({ mode: selectedMode, level })}
        disabled={total === 0}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-3 text-sm font-bold text-white hover:from-indigo-800 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200"
      >
        {total > 0 ? `始める — Bắt đầu (${total} thẻ)` : "Không có thẻ — hãy quay lại sau!"}
      </button>
    </div>
  );
}
