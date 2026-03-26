"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import VocabularyGrid from "@/components/vocabulary/VocabularyGrid";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

type Tab = "list" | "explain";

export default function VocabularyPage() {
  const { data: session } = useSession();
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("list");

  const [word,        setWord]        = useState("");
  const [reading,     setReading]     = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    setExplanation("");

    try {
      const res = await fetch(`${BASE_URL}/api/v1/vocabulary/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          word:       word.trim(),
          reading:    reading.trim() || word.trim(),
          user_level: user?.jlpt_level ?? "n5",
        }),
      });

      if (!res.ok)   throw new Error("Không thể kết nối tới server.");
      if (!res.body) throw new Error("Không có dữ liệu trả về.");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let payload: any;
          try { payload = JSON.parse(line.slice(6)); } catch { continue; }
          if (payload.error) throw new Error(payload.error);
          if (payload.done) break;
          setExplanation((prev) => prev + payload.delta);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Từ vựng</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Duyệt danh sách từ vựng theo cấp JLPT hoặc tra cứu bất kỳ từ nào với AI.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 rounded-xl border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {(["list", "explain"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t === "list" ? "Danh sách" : "Tra cứu AI"}
          </button>
        ))}
      </div>

      {/* List tab */}
      {tab === "list" && <VocabularyGrid />}

      {/* Explain tab */}
      {tab === "explain" && (
        <div className="space-y-4">
          <form
            onSubmit={handleExplain}
            className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Từ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="例: 食べる"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Cách đọc <span className="text-zinc-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder="例: たべる"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !word.trim()}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Đang giải thích..." : "Giải thích từ này"}
            </button>
          </form>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {(explanation || loading) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700">
                Giải thích:{" "}
                <span className="font-bold text-zinc-900">
                  {word}
                  {reading && `（${reading}）`}
                </span>
              </h2>
              {explanation ? (
                <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
                  {explanation}
                </div>
              ) : (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 animate-pulse rounded bg-zinc-100"
                      style={{ width: `${80 - i * 10}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
