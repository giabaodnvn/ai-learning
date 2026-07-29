"use client";

import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { LevelTabs } from "@/components/shared/LevelTabs";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { useLevelPagedList } from "@/hooks/useLevelPagedList";
import { type JlptLevel as Level } from "@/types/quiz";

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

export default function KanjiGrid() {
  const { level, page, setPage, changeLevel, data, isLoading, isError } =
    useLevelPagedList<Kanji>({ resource: "kanjis", path: "/api/v1/kanjis", perPage: 30 });

  return (
    <div className="space-y-5">

      {/* Level tabs */}
      <LevelTabs
        value={level}
        onChange={changeLevel}
        variant="colored"
        right={data && <span className="ml-auto text-xs text-zinc-400">{data.meta.total} chữ</span>}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-stone-100 animate-pulse aspect-square" />
          ))}
        </div>
      )}

      {isError && <ErrorBanner>Không thể tải dữ liệu. Vui lòng thử lại.</ErrorBanner>}

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
      {data && <Pagination page={page} pages={data.meta.pages} onChange={setPage} />}
    </div>
  );
}
