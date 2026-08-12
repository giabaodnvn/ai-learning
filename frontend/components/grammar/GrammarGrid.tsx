"use client";

import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { LevelTabs } from "@/components/shared/LevelTabs";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { LevelBadge } from "@/components/shared/LevelBadge";
import { useLevelPagedList } from "@/hooks/useLevelPagedList";
import { type JlptLevel as Level } from "@/types/quiz";

interface GrammarPoint {
  id: string;
  attributes: {
    pattern: string;
    explanation_vi: string;
    jlpt_level: Level;
    notes_vi: string | null;
  };
}

export default function GrammarGrid() {
  const { level, page, setPage, changeLevel, data, isLoading, isError } =
    useLevelPagedList<GrammarPoint>({
      resource: "grammar_points",
      path: "/api/v1/grammar_points",
      perPage: 20,
    });

  return (
    <div className="space-y-6">
      {/* Level tabs */}
      <LevelTabs value={level} onChange={changeLevel} />

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
      {isError && <ErrorBanner>Không thể tải dữ liệu. Vui lòng thử lại.</ErrorBanner>}

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
                <LevelBadge level={gp.attributes.jlpt_level} className="flex-shrink-0" />
              </div>
              <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
                {gp.attributes.explanation_vi}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && <Pagination page={page} pages={data.meta.pages} onChange={setPage} />}
    </div>
  );
}
