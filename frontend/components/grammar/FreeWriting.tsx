"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface GrammarError {
  part: string;
  issue_vi: string;
  suggestion: string;
}

interface CheckResult {
  correct: boolean;
  errors: GrammarError[];
  rewritten_sentence: string;
  explanation_vi: string;
}

interface FreeWritingProps {
  grammarPointId: number;
  pattern: string;
}

export default function FreeWriting({ grammarPointId, pattern }: FreeWritingProps) {
  const [sentence, setSentence] = useState("");
  const [result,   setResult]   = useState<CheckResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentence.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post(
        `/api/v1/grammar_points/${grammarPointId}/check_sentence`,
        { sentence: sentence.trim() }
      );
      setResult(res.data);
    } catch {
      setError("Không thể kiểm tra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Render the original sentence with error parts highlighted in red
   * and the rest in default colour.
   */
  function renderHighlighted(text: string, errors: GrammarError[]) {
    if (errors.length === 0) {
      return <span className="text-green-700">{text}</span>;
    }

    // Sort errors by first occurrence in text
    const sorted = [...errors].sort(
      (a, b) => text.indexOf(a.part) - text.indexOf(b.part)
    );

    const segments: { text: string; error: boolean }[] = [];
    let cursor = 0;

    for (const err of sorted) {
      const idx = text.indexOf(err.part, cursor);
      if (idx === -1) continue;
      if (idx > cursor) segments.push({ text: text.slice(cursor, idx), error: false });
      segments.push({ text: err.part, error: true });
      cursor = idx + err.part.length;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor), error: false });

    return (
      <>
        {segments.map((seg, i) =>
          seg.error ? (
            <span key={i} className="text-red-600 font-medium underline decoration-red-400">
              {seg.text}
            </span>
          ) : (
            <span key={i} className="text-green-700">
              {seg.text}
            </span>
          )
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Viết câu sử dụng <span className="font-semibold">{pattern}</span>
          </label>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="例: 私は毎日学校に行きます。"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !sentence.trim()}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang kiểm tra..." : "Kiểm tra ngữ pháp"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-zinc-100" style={{ width: `${85 - i * 15}%` }} />
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Verdict + highlighted sentence */}
          <div
            className={`rounded-xl border p-4 ${
              result.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}
          >
            <p className={`font-semibold text-sm mb-2 ${result.correct ? "text-green-800" : "text-red-800"}`}>
              {result.correct ? "✅ Câu đúng ngữ pháp!" : "❌ Câu có lỗi ngữ pháp"}
            </p>
            <p className="text-base leading-relaxed">
              {renderHighlighted(sentence, result.errors)}
            </p>
            {!result.correct && result.rewritten_sentence && (
              <p className="mt-2 text-sm text-zinc-600">
                Sửa thành:{" "}
                <span className="font-medium text-zinc-900">{result.rewritten_sentence}</span>
              </p>
            )}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              {result.errors.map((err, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-900">「{err.part}」</p>
                  <p className="text-amber-800 mt-0.5">{err.issue_vi}</p>
                  <p className="text-green-700 mt-0.5">→ {err.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Giải thích</p>
            <p className="text-sm text-zinc-700 leading-relaxed">{result.explanation_vi}</p>
          </div>

          {/* Try again */}
          <button
            onClick={() => { setResult(null); setSentence(""); }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Viết câu khác
          </button>
        </div>
      )}
    </div>
  );
}
