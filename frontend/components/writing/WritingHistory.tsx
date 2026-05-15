"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Submission {
  id:         number;
  topic:      string | null;
  text:       string;
  feedback:   string;
  created_at: string;
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (/^## /.test(line))
      return <h3 key={i} className="font-bold text-zinc-900 text-base mt-5 mb-2 first:mt-0">{parseLine(line.replace(/^## /, ""))}</h3>;
    if (/^### /.test(line))
      return <h4 key={i} className="font-semibold text-zinc-800 mt-3 mb-1">{parseLine(line.replace(/^### /, ""))}</h4>;
    if (/^(\d+)\. /.test(line))
      return <li key={i} className="ml-5 list-decimal text-zinc-700 leading-relaxed">{parseLine(line.replace(/^\d+\. /, ""))}</li>;
    if (/^- /.test(line))
      return <li key={i} className="ml-5 list-disc text-zinc-700 leading-relaxed">{parseLine(line.slice(2))}</li>;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-zinc-700 leading-relaxed">{parseLine(line)}</p>;
  });
}

function parseLine(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-zinc-900">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-sm text-indigo-700">{p.slice(1, -1)}</code>;
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i} className="italic text-zinc-500">{p.slice(1, -1)}</em>;
    return p;
  });
}

function SubmissionCard({ s }: { s: Submission }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(s.created_at).toLocaleDateString("vi-VN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

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
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Không thể tải lịch sử.{" "}
        <button onClick={() => refetch()} className="underline font-medium">Thử lại</button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
        <p className="text-2xl mb-2">📝</p>
        <p className="text-sm text-zinc-500">Chưa có bài viết nào được lưu.</p>
        <p className="text-xs text-zinc-400 mt-1">Viết bài đầu tiên để bắt đầu lịch sử.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400">{data.length} bài gần nhất (tối đa 100 bài được lưu)</p>
      {data.map((s) => <SubmissionCard key={s.id} s={s} />)}
    </div>
  );
}
