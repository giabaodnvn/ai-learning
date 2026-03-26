"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface GrammarError {
  part: string;
  issue_vi: string;
  suggestion: string;
}

interface GrammarResult {
  correct: boolean;
  errors: GrammarError[];
  rewritten_sentence: string;
  explanation_vi: string;
}

export default function GrammarPage() {
  const { user } = useCurrentUser();

  const [sentence, setSentence] = useState("");
  const [targetGrammar, setTargetGrammar] = useState("");
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!sentence.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post("/api/v1/grammar/check", {
        sentence: sentence.trim(),
        target_grammar: targetGrammar.trim() || null,
        user_level: user?.jlpt_level ?? "n5",
      });
      setResult(res.data);
    } catch {
      setError("Không thể kiểm tra ngữ pháp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Kiểm tra ngữ pháp</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Nhập câu tiếng Nhật để AI kiểm tra và giải thích lỗi bằng tiếng Việt.
        </p>
      </div>

      <form
        onSubmit={handleCheck}
        className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Câu cần kiểm tra <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="例: 私は学校に行きたいです。"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Ngữ pháp trọng tâm{" "}
            <span className="text-zinc-400 font-normal">(tùy chọn)</span>
          </label>
          <input
            type="text"
            value={targetGrammar}
            onChange={(e) => setTargetGrammar(e.target.value)}
            placeholder="例: 〜たい、〜てもいい"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-zinc-100" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div
            className={`rounded-2xl border p-4 flex items-center gap-3 ${
              result.correct
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <span className="text-2xl">{result.correct ? "✅" : "❌"}</span>
            <div>
              <p className={`font-semibold text-sm ${result.correct ? "text-green-800" : "text-red-800"}`}>
                {result.correct ? "Câu đúng ngữ pháp!" : "Câu có lỗi ngữ pháp"}
              </p>
              {!result.correct && result.rewritten_sentence && (
                <p className="text-sm mt-1 text-zinc-700">
                  Sửa thành:{" "}
                  <span className="font-medium text-zinc-900">
                    {result.rewritten_sentence}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-zinc-700 mb-3">
                Chi tiết lỗi
              </h2>
              <div className="space-y-3">
                {result.errors.map((err, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                      「{err.part}」
                    </p>
                    <p className="text-sm text-amber-800 mt-1">{err.issue_vi}</p>
                    <p className="text-sm text-green-700 mt-1">
                      → {err.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-700 mb-2">
              Giải thích
            </h2>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {result.explanation_vi}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
