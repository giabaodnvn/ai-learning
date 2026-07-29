"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/format";

interface Submission {
  id:         number;
  topic:      string | null;
  text:       string;
  feedback:   string;
  created_at: string;
}

function SubmissionCard({ s }: { s: Submission }) {
  const [expanded, setExpanded] = useState(false);

  const date = formatDateTime(s.created_at);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {s.topic && (
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {s.topic}
              </span>
            )}
            <span className="text-xs text-zinc-400">{date}</span>
          </div>
          <p className="text-sm text-zinc-700 font-mono truncate">{s.text}</p>
        </div>
        <span className="flex-shrink-0 text-zinc-400 text-sm mt-0.5">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
          {/* Original text */}
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
            <p className="text-xs text-zinc-400 mb-1">Bài viết gốc</p>
            <p className="text-sm text-zinc-700 font-mono whitespace-pre-wrap">{s.text}</p>
          </div>

          {/* Feedback */}
          <div className="space-y-0.5">
            {renderMarkdown(s.feedback)}
          </div>
        </div>
      )}
    </div>
  );
}

export function WritingHistory() {
  const { data, isLoading, isError, refetch } = useQuery<Submission[]>({
    queryKey: ["writing_history"],
    queryFn: async () => {
      const res = await api.get("/api/v1/writing/history");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorBanner>
        Không thể tải lịch sử.{" "}
        <button onClick={() => refetch()} className="underline font-medium">Thử lại</button>
        </ErrorBanner>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="Chưa có bài viết nào được lưu."
        subtitle="Viết bài đầu tiên để bắt đầu lịch sử."
        className="bg-zinc-50"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400">{data.length} bài gần nhất (tối đa 100 bài được lưu)</p>
      {data.map((s) => <SubmissionCard key={s.id} s={s} />)}
    </div>
  );
}
