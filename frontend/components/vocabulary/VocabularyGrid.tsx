"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { LevelTabs } from "@/components/shared/LevelTabs";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { useLevelPagedList } from "@/hooks/useLevelPagedList";
import { type JlptLevel as Level } from "@/types/quiz";

const POS_LABELS: Record<string, string> = {
  noun:       "Danh từ",
  verb:       "Động từ",
  adjective:  "Tính từ",
  adverb:     "Trạng từ",
  particle:   "Trợ từ",
  expression: "Thành ngữ",
  other:      "Khác",
};

const POS_COLORS: Record<string, string> = {
  noun:       "bg-blue-50 text-blue-700",
  verb:       "bg-green-50 text-green-700",
  adjective:  "bg-purple-50 text-purple-700",
  adverb:     "bg-amber-50 text-amber-700",
  particle:   "bg-rose-50 text-rose-700",
  expression: "bg-teal-50 text-teal-700",
  other:      "bg-zinc-100 text-zinc-600",
};

interface VocabItem {
  id: string;
  attributes: {
    word: string;
    reading: string;
    meaning_vi: string;
    part_of_speech: string | null;
    jlpt_level: Level;
    tags: string[];
  };
}

export default function VocabularyGrid() {
  const [search, setSearch] = useState("");
  const [query,  setQuery]  = useState("");   // committed search term

  const { level, page, setPage, changeLevel, resetPage, data, isLoading, isError } =
    useLevelPagedList<VocabItem>({
      resource: "vocabularies",
      path: "/api/v1/vocabularies",
      perPage: 30,
      params: query ? { search: query } : {},
    });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
    resetPage();
  }

  function clearSearch() {
    setSearch("");
    setQuery("");
    resetPage();
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm: từ, cách đọc, nghĩa..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Tìm
        </button>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Xóa
          </button>
        )}
      </form>

      {/* Level tabs */}
      {!query && <LevelTabs value={level} onChange={changeLevel} />}

      {/* Meta */}
      {data && (
        <p className="text-sm text-zinc-500">
          {query
            ? `${data.meta.total} kết quả cho "${query}"`
            : `${data.meta.total} từ vựng ${level.toUpperCase()}`}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-4">
              <div className="h-6 animate-pulse rounded bg-zinc-100 w-16" />
              <div className="h-4 animate-pulse rounded bg-zinc-100 w-24" />
              <div className="h-4 animate-pulse rounded bg-zinc-100 flex-1" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && <ErrorBanner>Không thể tải dữ liệu. Vui lòng thử lại.</ErrorBanner>}

      {/* Table */}
      {data && data.data.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Từ</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Cách đọc</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Nghĩa</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-semibold text-zinc-600">Từ loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.data.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900 text-base">{v.attributes.word}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{v.attributes.reading}</td>
                  <td className="px-4 py-3 text-zinc-700">{v.attributes.meaning_vi}</td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    {v.attributes.part_of_speech && (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        POS_COLORS[v.attributes.part_of_speech] ?? POS_COLORS.other
                      }`}>
                        {POS_LABELS[v.attributes.part_of_speech] ?? v.attributes.part_of_speech}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-sm text-zinc-500 py-4 text-center">Không tìm thấy từ nào.</p>
      )}

      {/* Pagination */}
      {data && <Pagination page={page} pages={data.meta.pages} onChange={setPage} />}
    </div>
  );
}
