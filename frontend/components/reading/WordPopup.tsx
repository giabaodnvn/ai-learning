import React, { useEffect, useRef } from "react";

export interface WordInfo {
  word: string;
  reading: string;
  meaning_vi: string;
  example?: string;
  example_vi?: string;
}

interface Props {
  word: string;
  info: WordInfo | null;
  loading: boolean;
  error: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

/**
 * Floating popup that appears near a tapped word.
 * Positioned relative to the viewport using anchorRect.
 */
export function WordPopup({ word, info, loading, error, anchorRect, onClose }: Props) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Compute position: below the word, clamped to viewport
  const style: React.CSSProperties = { position: "fixed", zIndex: 50 };
  if (anchorRect) {
    const top  = anchorRect.bottom + 6;
    const left = Math.min(anchorRect.left, window.innerWidth - 260);
    style.top  = `${top}px`;
    style.left = `${Math.max(8, left)}px`;
  } else {
    style.top  = "50%";
    style.left = "50%";
    style.transform = "translate(-50%, -50%)";
  }

  return (
    <div
      ref={popupRef}
      style={style}
      className="w-60 rounded-xl border border-zinc-200 bg-white shadow-lg p-4 space-y-2 text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-900 text-base">{word}</span>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 text-xs leading-none"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-36 animate-pulse rounded bg-zinc-100" />
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {info && !loading && (
        <>
          {info.reading && (
            <p className="text-zinc-500 text-xs">{info.reading}</p>
          )}
          <p className="text-zinc-800">{info.meaning_vi}</p>
          {info.example && (
            <div className="mt-1 rounded-lg bg-zinc-50 px-3 py-2 space-y-0.5">
              <p className="text-zinc-700 text-xs leading-snug">{info.example}</p>
              {info.example_vi && (
                <p className="text-zinc-400 text-xs">{info.example_vi}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
