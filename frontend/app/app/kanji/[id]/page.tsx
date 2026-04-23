"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface VocabExample {
  word: string;
  reading: string;
  meaning_vi: string;
}

interface KanjiAttrs {
  character: string;
  meaning_vi: string;
  jlpt_level: string;
  stroke_count: number;
  onyomi: string[];
  kunyomi: string[];
  vocab_examples: VocabExample[];
}

async function fetchKanji(id: string) {
  const res = await api.get(`/api/v1/kanjis/${id}`);
  return res.data.data as { id: string; attributes: KanjiAttrs };
}

export default function KanjiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["kanji", id],
    queryFn: () => fetchKanji(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded bg-zinc-100 w-1/3" />
        <div className="h-4 animate-pulse rounded bg-zinc-100 w-2/3" />
        <div className="h-4 animate-pulse rounded bg-zinc-100 w-1/2" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Không tìm thấy chữ kanji này.</p>
        <button onClick={() => router.back()} className="text-sm text-zinc-600 underline hover:text-zinc-800">
          ← Quay lại
        </button>
      </div>
    );
  }

  const kanji = data.attributes;
  const LEVEL_LABELS: Record<string, string> = {
    n5: "N5 — Sơ cấp",
    n4: "N4 — Sơ trung",
    n3: "N3 — Trung cấp",
    n2: "N2 — Trung cao",
    n1: "N1 — Cao cấp",
  };

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <p className="text-8xl font-bold text-zinc-900">{kanji.character}</p>
          <div className="flex flex-col gap-2 items-end">
            <span className="rounded-full bg-zinc-900 text-white px-3 py-1 text-sm font-medium">
              {kanji.jlpt_level.toUpperCase()}
            </span>
            <span className="text-xs text-zinc-500">
              {LEVEL_LABELS[kanji.jlpt_level] || kanji.jlpt_level}
            </span>
          </div>
        </div>

        {/* Stroke count */}
        {kanji.stroke_count && (
          <p className="text-sm text-zinc-600 mb-4">
            <span className="font-semibold">Số nét:</span> {kanji.stroke_count}
          </p>
        )}

        {/* Meaning */}
        <p className="text-lg text-zinc-800 font-medium">{kanji.meaning_vi}</p>
      </div>

      {/* Readings section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* On'yomi */}
        {kanji.onyomi.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-zinc-600 mb-3">音読み (On'yomi)</p>
            <div className="flex flex-wrap gap-2">
              {kanji.onyomi.map((reading, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium"
                >
                  {reading}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Kun'yomi */}
        {kanji.kunyomi.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-zinc-600 mb-3">訓読み (Kun'yomi)</p>
            <div className="flex flex-wrap gap-2">
              {kanji.kunyomi.map((reading, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium"
                >
                  {reading}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vocab examples */}
      {kanji.vocab_examples && kanji.vocab_examples.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-600 mb-4">Từ vựng ví dụ</p>
          <div className="space-y-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 px-3 font-medium text-zinc-600">Từ</th>
                  <th className="text-left py-2 px-3 font-medium text-zinc-600">Đọc</th>
                  <th className="text-left py-2 px-3 font-medium text-zinc-600">Nghĩa tiếng Việt</th>
                </tr>
              </thead>
              <tbody>
                {kanji.vocab_examples.map((vocab, idx) => (
                  <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-2 px-3 font-semibold text-zinc-900">{vocab.word}</td>
                    <td className="py-2 px-3 text-zinc-600">{vocab.reading}</td>
                    <td className="py-2 px-3 text-zinc-600">{vocab.meaning_vi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-600 underline hover:text-zinc-800 transition-colors"
      >
        ← Quay lại danh sách
      </button>
    </div>
  );
}
