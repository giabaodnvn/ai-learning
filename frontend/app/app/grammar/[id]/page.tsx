"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import FillInBlank from "@/components/grammar/FillInBlank";
import FreeWriting from "@/components/grammar/FreeWriting";
import AskAI from "@/components/grammar/AskAI";

type Tab = "fillblank" | "freewrite" | "askai";

const TABS: { id: Tab; label: string }[] = [
  { id: "fillblank", label: "Điền vào chỗ trống" },
  { id: "freewrite", label: "Viết tự do" },
  { id: "askai",     label: "Hỏi AI" },
];

interface GrammarPointAttrs {
  pattern: string;
  explanation_vi: string;
  jlpt_level: string;
  examples: { ja: string; vi: string }[];
  notes_vi: string | null;
}

async function fetchGrammarPoint(id: string) {
  const res = await api.get(`/api/v1/grammar_points/${id}`);
  return res.data.data as { id: string; attributes: GrammarPointAttrs };
}

export default function GrammarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [tab, setTab] = useState<Tab>("fillblank");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["grammar_point", id],
    queryFn:  () => fetchGrammarPoint(id),
    enabled:  !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-7 animate-pulse rounded bg-zinc-100 w-1/3" />
        <div className="h-4 animate-pulse rounded bg-zinc-100 w-2/3" />
        <div className="h-4 animate-pulse rounded bg-zinc-100 w-1/2" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Không tìm thấy điểm ngữ pháp này.</p>
        <button onClick={() => router.back()} className="text-sm text-zinc-600 underline">
          ← Quay lại
        </button>
      </div>
    );
  }

  const { attributes: gp } = data;
  const numericId = parseInt(id, 10);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
      >
        ← Danh sách ngữ pháp
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-900">{gp.pattern}</h1>
          <span className="flex-shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-500">
            {gp.jlpt_level.toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-zinc-600 leading-relaxed">{gp.explanation_vi}</p>

        {gp.notes_vi && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
            <p className="text-sm text-amber-800">📝 {gp.notes_vi}</p>
          </div>
        )}
      </div>

      {/* Examples */}
      {gp.examples && gp.examples.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Ví dụ</h2>
          <div className="space-y-3">
            {gp.examples.map((ex, i) => (
              <div key={i} className="border-l-2 border-zinc-300 pl-3">
                <p className="text-base text-zinc-800">{ex.ja}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{ex.vi}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice panel */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-zinc-900 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "fillblank" && <FillInBlank grammarPointId={numericId} />}
          {tab === "freewrite" && <FreeWriting grammarPointId={numericId} pattern={gp.pattern} />}
          {tab === "askai"    && <AskAI grammarPointId={numericId} pattern={gp.pattern} />}
        </div>
      </div>
    </div>
  );
}
