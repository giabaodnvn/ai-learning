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

interface GrammarPoint {
  id: string;
  attributes: {
    pattern: string;
    explanation_vi: string;
    jlpt_level: Level;
    notes_vi: string | null;
  };
}

interface GrammarResponse {
  data: GrammarPoint[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

async function fetchGrammarPoints(level: Level, page: number): Promise<GrammarResponse> {
  const res = await api.get("/api/v1/grammar_points", {
    params: { level, page, per_page: 20 },
  });
  return res.data;
}

export default function GrammarGrid() {
  const [level, setLevel] = useState<Level>("n5");
  const [page,  setPage]  = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["grammar_points", level, page],
    queryFn:  () => fetchGrammarPoints(level, page),
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
          {data.meta.total} điểm ngữ pháp {level.toUpperCase()}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2">
              <div className="h-5 animate-pulse rounded bg-zinc-100 w-1/2" />
              <div className="h-4 animate-pulse rounded bg-zinc-100 w-3/4" />
              <div className="h-4 animate-pulse rounded bg-zinc-100 w-2/3" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.data.map((gp) => (
            <Link
              key={gp.id}
              href={`/app/grammar/${gp.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-zinc-900 text-base leading-snug group-hover:text-zinc-700">
                  {gp.attributes.pattern}
                </p>
                <span className="flex-shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {gp.attributes.jlpt_level.toUpperCase()}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
                {gp.attributes.explanation_vi}
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
