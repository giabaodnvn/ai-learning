"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageBubble, type Message } from "@/components/conversation/MessageBubble";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

const ROLE_META: Record<string, { label: string; icon: string }> = {
  tutor:                   { label: "Gia sư tiếng Nhật",    icon: "👩‍🏫" },
  convenience_store_clerk: { label: "Cửa hàng tiện lợi",   icon: "🏪" },
  restaurant_staff:        { label: "Nhà hàng Nhật",        icon: "🍜" },
  office_colleague:        { label: "Đồng nghiệp văn phòng", icon: "💼" },
  hotel_staff:             { label: "Khách sạn",            icon: "🏨" },
  airport_staff:           { label: "Sân bay",              icon: "✈️" },
};

interface SessionDetail {
  id: number;
  role: string;
  role_name_vi: string;
  role_icon: string;
  jlpt_level: string;
  messages: Message[];
}

export default function ConversationChatPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { data: session } = useSession();

  const [chatSession, setChatSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session
  const loadSession = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/conversations/${id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) { router.replace("/app/conversation"); return; }
      const data: SessionDetail = await res.json();
      setChatSession(data);
      setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  }, [id, session?.accessToken, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleSend(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming || !session?.accessToken) return;

    setInput("");
    setError(null);

    // Optimistically add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder for streaming AI message
    const aiPlaceholder: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, aiPlaceholder]);
    setStreaming(true);

    let accumulated = "";

    try {
      const res = await fetch(`${BASE_URL}/api/v1/conversations/${id}/send_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("Lỗi kết nối server.");
      if (!res.body) throw new Error("Không có dữ liệu.");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let payload: any;
          try { payload = JSON.parse(line.slice(6)); } catch { continue; }

          // Legacy error format from SseStreamable
          if (payload.error) throw new Error(payload.error);

          if (payload.type === "delta") {
            accumulated += payload.content ?? "";
            // Strip [CORRECTIONS] block from live display (it arrives at the end)
            const liveContent = accumulated.replace(/\[CORRECTIONS\][\s\S]*$/i, "").trimEnd();
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: liveContent };
              return updated;
            });
          } else if (payload.type === "correction") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role:           "assistant",
                content:        payload.content ?? accumulated,  // parsed clean content from backend
                corrections:    payload.corrections,
                new_words:      payload.new_words,
                translation_vi: payload.translation_vi,
              };
              return updated;
            });
          } else if (payload.type === "done") {
            break;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      // Remove the streaming placeholder
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-2 w-full max-w-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  const meta = ROLE_META[chatSession?.role ?? ""] ?? { label: chatSession?.role_name_vi ?? "", icon: "💬" };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 110px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button
          onClick={() => router.push("/app/conversation")}
          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 transition-colors"
          title="Quay lại"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
          </svg>
        </button>
        <span className="text-2xl">{chatSession?.role_icon ?? meta.icon}</span>
        <div>
          <h1 className="text-base font-bold text-zinc-900 leading-tight">
            {chatSession?.role_name_vi ?? meta.label}
          </h1>
          <p className="text-xs text-zinc-500">
            Trình độ {chatSession?.jlpt_level?.toUpperCase() ?? "N5"}
            <span className="mx-1.5 text-zinc-300">·</span>
            {messages.length} tin nhắn
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <p className="text-center py-12 text-sm text-zinc-400">
            Hãy gửi tin nhắn đầu tiên để bắt đầu hội thoại.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 flex-shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 flex gap-2 pt-3 border-t border-zinc-200 items-end"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          placeholder="Nhập câu tiếng Nhật... (Enter để gửi, Shift+Enter xuống dòng)"
          className="flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 leading-relaxed"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="flex-shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors h-10"
        >
          {streaming ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
              <path d="M14 8a6 6 0 0 1-6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
