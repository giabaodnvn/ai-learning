"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

const ROLES = [
  { value: "free_talk", label: "Hội thoại tự do", emoji: "💬" },
  { value: "shopping",  label: "Mua sắm",         emoji: "🛍️" },
  { value: "travel",    label: "Du lịch",          emoji: "✈️" },
  { value: "interview", label: "Phỏng vấn",        emoji: "💼" },
  { value: "story",     label: "Kể chuyện",        emoji: "📖" },
  { value: "debate",    label: "Tranh luận",        emoji: "⚖️" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  corrections?: Correction[];
  newWords?: NewWord[];
}

interface Correction {
  original: string;
  corrected: string;
  explanation_vi: string;
}

interface NewWord {
  word: string;
  reading: string;
  meaning_vi: string;
}

function parseAssistantContent(raw: string): {
  content: string;
  corrections: Correction[];
  newWords: NewWord[];
} {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return { content: raw, corrections: [], newWords: [] };

  try {
    const meta = JSON.parse(jsonMatch[1]);
    const content = raw.slice(0, raw.indexOf("```json")).trim();
    return {
      content,
      corrections: meta.corrections ?? [],
      newWords: meta.new_words ?? [],
    };
  } catch {
    return { content: raw, corrections: [], newWords: [] };
  }
}

export default function ConversationPage() {
  const { data: session } = useSession();
  const { user } = useCurrentUser();

  const [role, setRole] = useState("free_talk");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function handleStart() {
    setMessages([]);
    setStarted(true);
    setError(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setStreaming(true);
    setError(null);

    const apiMessages = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let raw = "";
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", corrections: [], newWords: [] },
    ]);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/conversation/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          role,
          user_level: user?.jlpt_level ?? "n5",
        }),
      });

      if (!res.ok) throw new Error("Lỗi kết nối server.");
      if (!res.body) throw new Error("Không có dữ liệu.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let payload: any;
          try {
            payload = JSON.parse(line.slice(6));
          } catch {
            continue; // skip malformed lines
          }
          if (payload.error) throw new Error(payload.error);
          if (payload.done) break;
          raw += payload.delta;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: raw,
              corrections: [],
              newWords: [],
            };
            return updated;
          });
        }
      }

      const parsed = parseAssistantContent(raw);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: parsed.content,
          corrections: parsed.corrections,
          newWords: parsed.newWords,
        };
        return updated;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Hội thoại AI</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Luyện nói tiếng Nhật với AI. Chọn tình huống và bắt đầu.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <p className="text-sm font-medium text-zinc-700">Chọn tình huống</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-sm font-medium transition-colors ${
                  role === r.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Bắt đầu hội thoại
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {ROLES.find((r) => r.value === role)?.emoji} {roleLabel}
          </h1>
          <p className="text-xs text-zinc-500">
            Trình độ: {user?.jlpt_level?.toUpperCase() ?? "N5"}
          </p>
        </div>
        <button
          onClick={() => setStarted(false)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Đổi tình huống
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-sm text-zinc-400">
            Hãy gửi tin nhắn đầu tiên để bắt đầu hội thoại.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] space-y-2`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white rounded-br-sm"
                    : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
                }`}
              >
                {msg.content || (
                  <span className="inline-block w-4 h-4 animate-pulse bg-zinc-300 rounded" />
                )}
              </div>

              {/* Corrections */}
              {msg.role === "assistant" && msg.corrections && msg.corrections.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs space-y-1">
                  <p className="font-semibold text-amber-800">Sửa lỗi</p>
                  {msg.corrections.map((c, j) => (
                    <div key={j}>
                      <span className="line-through text-red-500">{c.original}</span>
                      {" → "}
                      <span className="text-green-700 font-medium">{c.corrected}</span>
                      <p className="text-amber-700">{c.explanation_vi}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* New words */}
              {msg.role === "assistant" && msg.newWords && msg.newWords.length > 0 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs space-y-1">
                  <p className="font-semibold text-indigo-800">Từ mới</p>
                  {msg.newWords.map((w, j) => (
                    <p key={j} className="text-indigo-700">
                      <span className="font-medium">{w.word}</span>
                      {w.reading && `（${w.reading}）`} — {w.meaning_vi}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-zinc-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Nhập câu tiếng Nhật..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {streaming ? "..." : "Gửi"}
        </button>
      </form>
    </div>
  );
}
