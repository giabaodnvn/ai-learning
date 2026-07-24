"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSSEStream } from "@/hooks/useSSEStream";

interface Props {
  vocabId: number;
  word: string;
  open: boolean;
  onClose: () => void;
}

const EXPLAIN_ERROR = "Không tải được giải thích. Vui lòng thử lại.";

export function ExplainPanel({ vocabId, word, open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { content, streaming, error, start, reset } = useSSEStream({
    onDone: (full) => {
      // Populate React Query cache so re-opens are instant.
      if (full) queryClient.setQueryData(["vocab-explain", vocabId], full);
    },
    errorMessage: () => EXPLAIN_ERROR,
    networkError: EXPLAIN_ERROR,
  });

  // Prefetched / cached explanation for this word, if any — read (not
  // subscribed) so an instant re-open doesn't re-stream. Not in the effect deps
  // on purpose: onDone writes this cache, and we don't want that write to
  // re-run the effect and reset the just-streamed content.
  const cached = queryClient.getQueryData<string>(["vocab-explain", vocabId]);

  useEffect(() => {
    if (!open) return;
    if (queryClient.getQueryData<string>(["vocab-explain", vocabId])) return;

    start(`/api/v1/vocabularies/${vocabId}/explain`);
    return () => reset();
  }, [open, vocabId, start, reset, queryClient]);

  if (!open) return null;

  const displayContent = cached ?? content;
  const loading = streaming;

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
          {error && !displayContent && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading && !displayContent && (
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
          {displayContent && (
            <div className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap pb-6">
              {displayContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
