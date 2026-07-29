"use client";

import { useState } from "react";
import { JLPT_LEVELS } from "@/types/quiz";

export interface TopicOption {
  label: string;
  value: string;
}

interface Props {
  title: string;
  topics: TopicOption[];
  customPlaceholder: string;
  /** Explicit level override; "" means "follow the account level". */
  level: string;
  onLevelChange: (level: string) => void;
  accountLevel?: string;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  error?: string | null;
  onSubmit: (topic: string) => void;
}

/**
 * Topic + level form shared by the reading and listening generators.
 * Owns the topic-preset / free-text state; the caller only receives the
 * resolved topic string.
 */
export function GenerateForm({
  title,
  topics,
  customPlaceholder,
  level,
  onLevelChange,
  accountLevel,
  submitting,
  submitLabel,
  submittingLabel,
  error,
  onSubmit,
}: Props) {
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return;
    onSubmit(finalTopic);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Chủ đề</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
          >
            <option value="">-- Chọn chủ đề --</option>
            {topics.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Hoặc nhập tự do</label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={customPlaceholder}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Trình độ</label>
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
          >
            <option value="">Theo tài khoản ({accountLevel?.toUpperCase() ?? "N5"})</option>
            {JLPT_LEVELS.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || (!topic && !customTopic.trim())}
        className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
