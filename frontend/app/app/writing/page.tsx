"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WritingEditor } from "@/components/writing/WritingEditor";
import { WritingHistory } from "@/components/writing/WritingHistory";
import { PageHeader } from "@/components/shared/PageHeader";

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
      <PageHeader
        title="Luyện viết tiếng Nhật"
        description="Viết câu hoặc đoạn văn tiếng Nhật, AI sẽ chấm ngữ pháp và gợi ý cải thiện."
      />

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
