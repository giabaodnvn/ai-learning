"use client";

import { useState, useRef, useEffect } from "react";
import { streamSSE } from "@/lib/sse";

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
  const abortRef  = useRef<AbortController | null>(null);

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Abort any in-flight stream on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

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
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let accumulated = "";

    try {
      // Show typing indicator while streaming
      setMessages([...msgs, { role: "assistant", content: "" }]);

      await streamSSE(
        `/api/v1/grammar_points/${grammarPointId}/ask`,
        { method: "POST", body: { messages: msgs }, signal: ctrl.signal },
        (payload) => {
          if (payload.error) throw new Error(payload.error);
          if (payload.delta) {
            accumulated += payload.delta;
            setMessages([...msgs, { role: "assistant", content: accumulated }]);
          }
          if (payload.done) return true;
        },
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
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
