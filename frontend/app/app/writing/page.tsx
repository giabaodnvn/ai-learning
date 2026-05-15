"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WritingEditor } from "@/components/writing/WritingEditor";
import { WritingHistory } from "@/components/writing/WritingHistory";

type Tab = "editor" | "history";

export default function WritingPage() {
  const [tab, setTab] = useState<Tab>("editor");
  const queryClient   = useQueryClient();

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ["writing_history"] });
    setTab("history");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Luyện viết tiếng Nhật</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Viết câu hoặc đoạn văn tiếng Nhật, AI sẽ chấm ngữ pháp và gợi ý cải thiện.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-200">
        {([["editor", "Viết mới"], ["history", "Lịch sử"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "editor" && <WritingEditor onSaved={handleSaved} />}
      {tab === "history" && <WritingHistory />}
    </div>
  );
}
