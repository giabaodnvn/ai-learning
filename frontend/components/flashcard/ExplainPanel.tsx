"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

interface Props {
  vocabId: number;
  word: string;
  open: boolean;
  onClose: () => void;
}

export function ExplainPanel({ vocabId, word, open, onClose }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    if (!open) return;

    // Use prefetched / cached data if available — instant display
    const cached = queryClient.getQueryData<string>(["vocab-explain", vocabId]);
    if (cached) {
      setContent(cached);
      return;
    }

    // Stream fresh from server
    setContent("");
    setLoading(true);
    let buffer = "";
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/vocabularies/${vocabId}/explain`, {
          headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` },
        });
        if (!res.body) throw new Error("no body");

        const reader = res.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          const text = decoder.decode(value, { stream: true });
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            let payload: { delta?: string; done?: boolean; error?: string };
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (payload.error || payload.done) break outer;
            buffer += payload.delta ?? "";
            setContent(buffer);
          }
        }

        // Populate React Query cache so re-opens are instant
        if (!cancelled && buffer) {
          queryClient.setQueryData(["vocab-explain", vocabId], buffer);
        }
      } catch {
        // Ignore abort / network errors
      } finally {
        setLoading(false);
        readerRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      readerRef.current?.cancel().catch(() => {});
    };
  }, [open, vocabId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Slide-up panel */}
      <div
        className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
        style={{ animation: "slide-up 0.25s ease-out" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 flex-shrink-0">
          <p className="font-semibold text-zinc-900">
            ✨ AI giải thích:{" "}
            <span className="text-indigo-700">{word}</span>
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {loading && !content && (
            <div className="space-y-2.5 py-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 animate-pulse rounded bg-zinc-100"
                  style={{ width: `${95 - i * 7}%` }}
                />
              ))}
            </div>
          )}
          {content && (
            <div className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap pb-6">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
