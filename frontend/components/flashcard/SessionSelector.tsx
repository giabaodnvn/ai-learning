"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SessionMode } from "@/lib/flashcard-utils";
import type { SessionConfig } from "@/lib/stores/flashcardStore";

interface Props {
  onStart: (config: SessionConfig) => void;
}

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"];

const MODES: {
  mode: SessionMode;
  label: string;
  desc: string;
  icon: string;
  apiType: string;
}[] = [
  { mode: "daily",         label: "Hằng ngày",  desc: "Tất cả loại thẻ",  icon: "📅", apiType: "all" },
  { mode: "vocabulary",    label: "Từ vựng",    desc: "Chỉ từ vựng",       icon: "📝", apiType: "vocabulary" },
  { mode: "kanji",         label: "Kanji",      desc: "Chỉ chữ Hán",       icon: "漢", apiType: "kanji" },
  { mode: "grammar_point", label: "Ngữ pháp",   desc: "Chỉ ngữ pháp",      icon: "📖", apiType: "grammar_point" },
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
  mode,
  label,
  desc,
  icon,
  apiType,
  selected,
  level,
  onSelect,
}: {
  mode: SessionMode;
  label: string;
  desc: string;
  icon: string;
  apiType: string;
  selected: boolean;
  level?: string;
  onSelect: () => void;
}) {
  const { due, newCount, total, loading } = useCardCounts(apiType, level);

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-3xl leading-none">{icon}</span>
        {loading ? (
          <span className="h-4 w-8 animate-pulse rounded bg-zinc-200" />
        ) : total > 0 ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {total}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">
            Xong
          </span>
        )}
      </div>
      <p className={`mt-3 text-sm font-semibold ${selected ? "text-indigo-900" : "text-zinc-800"}`}>
        {label}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      {!loading && total > 0 && (
        <p className="mt-1.5 text-xs text-zinc-400">
          {due > 0 && <span className="text-amber-600">{due} ôn tập</span>}
          {due > 0 && newCount > 0 && <span className="mx-1">·</span>}
          {newCount > 0 && <span className="text-green-600">{newCount} từ mới</span>}
        </p>
      )}
    </button>
  );
}

export function SessionSelector({ onStart }: Props) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>("daily");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const level = selectedLevel || undefined;
  const selectedApiType = MODES.find((m) => m.mode === selectedMode)?.apiType ?? "all";
  const { total } = useCardCounts(selectedApiType, level);

  function handleStart() {
    onStart({ mode: selectedMode, level });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-800">Chọn chế độ học</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Mỗi phiên gồm thẻ cần ôn tập hôm nay + thẻ mới chưa học
        </p>
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
        <p className="text-xs font-medium text-zinc-600 mb-2">Lọc theo trình độ (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLevel("")}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selectedLevel === ""
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            Tất cả
          </button>
          {JLPT_LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setSelectedLevel(lv)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selectedLevel === lv
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {lv.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={total === 0}
        className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {total > 0 ? `Bắt đầu học (${total} thẻ)` : "Không có thẻ nào — hãy quay lại sau!"}
      </button>
    </div>
  );
}
