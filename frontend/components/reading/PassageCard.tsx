import React from "react";

export interface PassageData {
  id: number;
  title: string | null;
  content: string;
  jlpt_level: string;
  topic: string | null;
  questions: Question[];
  vocabulary_highlights: VocabHighlight[];
  ai_generated: boolean;
  created_at: string;
}

export interface Question {
  question: string;
  options: string[];
  answer_index: number;
}

export interface VocabHighlight {
  word: string;
  reading: string;
  meaning_vi: string;
}

const LEVEL_COLORS: Record<string, string> = {
  n5: "bg-green-100 text-green-700",
  n4: "bg-teal-100 text-teal-700",
  n3: "bg-blue-100 text-blue-700",
  n2: "bg-violet-100 text-violet-700",
  n1: "bg-red-100 text-red-700",
};

interface Props {
  passage: PassageData;
  onClick: (passage: PassageData) => void;
}

export function PassageCard({ passage, onClick }: Props) {
  const levelColor = LEVEL_COLORS[passage.jlpt_level] ?? "bg-zinc-100 text-zinc-700";

  // Preview: strip HTML tags for the snippet
  const preview = passage.content
    .replace(/<rt>.*?<\/rt>/g, "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 80);

  return (
    <button
      onClick={() => onClick(passage)}
      className="w-full text-left rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2">
          {passage.title ?? "Bài đọc không có tiêu đề"}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${levelColor}`}
        >
          {passage.jlpt_level}
        </span>
      </div>

      {passage.topic && (
        <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          {passage.topic}
        </span>
      )}

      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{preview}…</p>

      <p className="text-xs text-zinc-400">
        {passage.questions.length} câu hỏi · {passage.vocabulary_highlights.length} từ vựng
      </p>
    </button>
  );
}
