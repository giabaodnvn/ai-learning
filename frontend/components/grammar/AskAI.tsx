"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AskAIProps {
  grammarPointId: number;
  pattern: string;
}

export default function AskAI({ grammarPointId, pattern }: AskAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [pending,  setPending]  = useState<Message[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending !== null) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];

    setPending(nextMessages);
    setInput("");
    triggerAsk(nextMessages);
  }

  async function triggerAsk(msgs: Message[]) {
    // Use a manual SSE fetch with POST instead of useSSE (which does GET).
    // We replicate the SSE reading here for POST support.
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

    let accumulated = "";

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/grammar_points/${grammarPointId}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.accessToken ?? ""}`,
          },
          body: JSON.stringify({ messages: msgs }),
        }
      );

      if (!res.ok || !res.body) throw new Error("Lỗi kết nối");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      // Show typing indicator while streaming
      setMessages([...msgs, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done: readDone } = await reader.read();
        if (readDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let payload: { delta?: string; done?: boolean; error?: string };
          try { payload = JSON.parse(line.slice(6)); } catch { continue; }
          if (payload.error) throw new Error(payload.error);
          if (payload.delta) {
            accumulated += payload.delta;
            setMessages([...msgs, { role: "assistant", content: accumulated }]);
          }
          if (payload.done) return;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setMessages([...msgs, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col h-[420px]">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400 text-center mt-8">
            Hỏi bất kỳ câu hỏi nào về <span className="font-medium">{pattern}</span>
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {msg.content === "" ? (
                /* Typing indicator */
                <span className="flex gap-1 items-center py-1">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: `${n * 0.15}s` }}
                    />
                  ))}
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-zinc-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về ngữ pháp này..."
          disabled={pending !== null}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || pending !== null}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          Gửi
        </button>
      </form>

    </div>
  );
}
