"use client";

import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { useSSEStream } from "@/hooks/useSSEStream";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

const TOPICS = [
  "Tự giới thiệu bản thân",
  "Kể về cuối tuần của bạn",
  "Mô tả quê hương / thành phố của bạn",
  "Sở thích và thú vui",
  "Kế hoạch tương lai",
  "Một ngày đi làm / đi học",
  "Món ăn yêu thích",
  "Du lịch trong mơ",
];

interface Props {
  onSaved?: () => void;
}

export function WritingEditor({ onSaved }: Props = {}) {
  const [text,  setText]  = useState("");
  const [topic, setTopic] = useState("");
  const { content: feedback, streaming, error, start, reset } = useSSEStream({
    onDone:       () => onSaved?.(),
    errorMessage: () => "AI gặp lỗi. Vui lòng thử lại.",
  });

  const charCount  = text.length;
  const MAX_CHARS  = 2000;
  const MIN_CHARS  = 10;
  const canSubmit  = charCount >= MIN_CHARS && charCount <= MAX_CHARS && !streaming;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    await start("/api/v1/writing/feedback", {
      method: "POST",
      body:   { text: text.trim(), topic: topic || undefined },
    });
  }

  function handleReset() {
    reset();
    setText("");
    setTopic("");
  }

  return (
    <div className="space-y-5">
      {/* Input panel */}
      {!feedback && !streaming && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic picker */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Chủ đề <span className="text-zinc-400 font-normal">(tùy chọn)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(topic === t ? "" : t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    topic === t
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Hoặc nhập chủ đề tuỳ ý..."
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Bài viết của bạn
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"例:\n私は毎日日本語を勉強しています。\n昨日、友達と一緒に映画を見ました。"}
              rows={8}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 resize-y"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-zinc-400">Tối thiểu {MIN_CHARS} ký tự</p>
              <p className={`text-xs ${charCount > MAX_CHARS ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                {charCount} / {MAX_CHARS}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            Nhận phản hồi AI
          </button>
        </form>
      )}

      {/* Streaming indicator */}
      {streaming && !feedback && (
        <div className="space-y-2 py-2">
          {[80, 65, 50].map((w, i) => (
            <div key={i} className="h-3.5 animate-pulse rounded bg-zinc-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Feedback panel */}
      {(feedback || streaming) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Phản hồi AI
            </p>
            {streaming && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600">
                <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Đang phân tích...
              </span>
            )}
          </div>

          {/* Original text reference */}
          <div className="mb-4 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
            <p className="text-xs text-zinc-400 mb-1">Bài viết của bạn{topic ? ` — ${topic}` : ""}</p>
            <p className="text-sm text-zinc-700 font-mono whitespace-pre-wrap">{text}</p>
          </div>

          {/* Streamed markdown */}
          <div className="prose prose-sm max-w-none space-y-0.5">
            {renderMarkdown(feedback)}
            {streaming && <span className="inline-block w-1 h-4 bg-zinc-400 animate-pulse align-middle ml-0.5" />}
          </div>

          {!streaming && (
            <button
              onClick={handleReset}
              className="mt-5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Viết bài mới
            </button>
          )}
        </div>
      )}

      {error && (
        <ErrorBanner>{error}</ErrorBanner>
      )}
    </div>
  );
}
