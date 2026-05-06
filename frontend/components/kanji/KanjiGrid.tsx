"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const LEVELS = ["n5", "n4", "n3", "n2", "n1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_META: Record<Level, { label: string; jp: string; activeClass: string; inactiveClass: string }> = {
  n5: { label: "N5", jp: "初級",   activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200", inactiveClass: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
  n4: { label: "N4", jp: "初中級", activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200",         inactiveClass: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  n3: { label: "N3", jp: "中級",   activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200",      inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50" },
  n2: { label: "N2", jp: "中上級", activeClass: "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200",   inactiveClass: "border-violet-200 text-violet-700 hover:bg-violet-50" },
  n1: { label: "N1", jp: "上級",   activeClass: "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200",         inactiveClass: "border-rose-200 text-rose-700 hover:bg-rose-50" },
};

interface Kanji {
  id: string;
  attributes: {
    character: string;
    meaning_vi: string;
    jlpt_level: Level;
    stroke_count: number;
    onyomi: string[];
    kunyomi: string[];
  };
}

interface KanjiResponse {
  data: Kanji[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

async function fetchKanjis(level: Level, page: number): Promise<KanjiResponse> {
  const res = await api.get("/api/v1/kanjis", { params: { level, page, per_page: 30 } });
  return res.data;
}

export default function KanjiGrid() {
  const [level, setLevel] = useState<Level>("n5");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["kanjis", level, page],
    queryFn: () => fetchKanjis(level, page),
  });

  function handleLevelChange(l: Level) {
    setLevel(l);
    setPage(1);
  }

  const meta = LEVEL_META[level];

  return (
    <div className="space-y-5">

      {/* Level tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {LEVELS.map((l) => {
          const m = LEVEL_META[l];
          return (
            <button
              key={l}
              onClick={() => handleLevelChange(l)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
                level === l ? m.activeClass : m.inactiveClass
              }`}
            >
              {m.label}
              <span className={`ml-1.5 text-xs font-normal ${level === l ? "opacity-80" : "opacity-60"}`}>
                {m.jp}
              </span>
            </button>
          );
        })}
        {data && (
          <span className="ml-auto text-xs text-zinc-400">
            {data.meta.total} chữ
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-stone-100 animate-pulse aspect-square" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500 text-center py-8">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      )}

      {/* Kanji grid */}
      {data && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.data.map((kanji) => {
            const { character, meaning_vi, stroke_count, onyomi, kunyomi } = kanji.attributes;
            return (
              <Link
                key={kanji.id}
                href={`/app/kanji/${kanji.id}`}
                className="group relative rounded-2xl border border-stone-200 bg-[#FAF7F2] hover:border-indigo-300 hover:shadow-md hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center aspect-square overflow-hidden p-3"
              >
                {/* Stroke count badge */}
                <span className="absolute top-2 right-2.5 text-[9px] font-semibold text-zinc-400 group-hover:text-indigo-400 transition-colors">
                  {stroke_count}画
                </span>

                {/* Main character */}
                <p className="text-4xl sm:text-5xl font-bold text-zinc-900 group-hover:text-indigo-800 transition-colors leading-none mb-2">
                  {character}
                </p>

                {/* Readings */}
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {onyomi.length > 0 && (
                    <p className="text-[10px] font-semibold text-rose-600 truncate w-full text-center leading-tight">
                      {onyomi.slice(0, 2).join("・")}
                    </p>
                  )}
                  {kunyomi.length > 0 && (
                    <p className="text-[10px] text-teal-600 truncate w-full text-center leading-tight">
                      {kunyomi.slice(0, 2).join("・")}
                    </p>
                  )}
                </div>

                {/* Meaning */}
                <p className="mt-1.5 text-[10px] text-zinc-500 text-center line-clamp-1 w-full">
                  {meaning_vi}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 ${meta.inactiveClass}`}
          >
            ← Trước
          </button>
          <span className="text-sm text-zinc-500 tabular-nums">
            {page} / {data.meta.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
            disabled={page === data.meta.pages}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 ${meta.inactiveClass}`}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
