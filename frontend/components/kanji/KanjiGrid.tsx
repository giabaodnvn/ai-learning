"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const LEVELS = ["n5", "n4", "n3", "n2", "n1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_LABELS: Record<Level, string> = {
  n5: "N5 — Sơ cấp",
  n4: "N4 — Sơ trung",
  n3: "N3 — Trung cấp",
  n2: "N2 — Trung cao",
  n1: "N1 — Cao cấp",
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
  const res = await api.get("/api/v1/kanjis", {
    params: { level, page, per_page: 30 },
  });
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

  return (
    <div className="space-y-6">
      {/* Level tabs */}
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => handleLevelChange(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              level === l
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Meta */}
      {data && (
        <p className="text-sm text-zinc-500">
          {data.meta.total} chữ kanji {level.toUpperCase()}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 aspect-square">
              <div className="h-12 animate-pulse rounded bg-zinc-100 w-full" />
              <div className="h-3 animate-pulse rounded bg-zinc-100 w-full" />
              <div className="h-3 animate-pulse rounded bg-zinc-100 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-red-600">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      )}

      {/* Grid */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.data.map((kanji) => (
            <Link
              key={kanji.id}
              href={`/app/kanji/${kanji.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:shadow-sm transition-all flex flex-col items-center justify-center aspect-square"
            >
              <p className="text-5xl font-bold text-zinc-900 group-hover:text-zinc-700 mb-2">
                {kanji.attributes.character}
              </p>
              <div className="flex flex-col items-center gap-1 text-xs">
                {kanji.attributes.onyomi.length > 0 && (
                  <p className="text-zinc-500">
                    {kanji.attributes.onyomi.slice(0, 2).join("、")}
                  </p>
                )}
                {kanji.attributes.kunyomi.length > 0 && (
                  <p className="text-zinc-400">
                    {kanji.attributes.kunyomi.slice(0, 2).join("、")}
                  </p>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500 text-center line-clamp-1">
                {kanji.attributes.meaning_vi}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            ← Trước
          </button>
          <span className="text-sm text-zinc-500">
            {page} / {data.meta.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
            disabled={page === data.meta.pages}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
