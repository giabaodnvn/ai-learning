"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { WordPopup, WordInfo } from "./WordPopup";
import type { PassageData, VocabHighlight } from "./PassageCard";
import { parseSegments } from "@/lib/furigana";

// ---------------------------------------------------------------------------
// TTS speed options
// ---------------------------------------------------------------------------
const SPEED_OPTIONS = [
  { label: "0.75×", value: 0.75 },
  { label: "1×",    value: 1 },
  { label: "1.25×", value: 1.25 },
];

// ---------------------------------------------------------------------------
// ReaderView
// ---------------------------------------------------------------------------

interface Props {
  passage: PassageData;
  onStartQuiz: () => void;
}

export function ReaderView({ passage, onStartQuiz }: Props) {
  const [showFurigana, setShowFurigana] = useState(true);

  // Word popup state
  const [popupWord,  setPopupWord]  = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Parse content once
  const { segments, plainText } = useMemo(
    () => parseSegments(passage.content),
    [passage.content]
  );

  // TTS
  const tts = useTextToSpeech(plainText);

  // vocabulary_highlights already carries the meaning for the words the
  // generator flagged — those need no API call at all.
  const highlighted = popupWord
    ? passage.vocabulary_highlights.find(
        (v: VocabHighlight) => v.word === popupWord || v.reading === popupWord
      )
    : undefined;

  // Keyed on the word, so tapping B while A is still in flight can no longer
  // render A's meaning under B's heading — and re-tapping a word is a cache hit.
  const lookup = useQuery<WordInfo>({
    queryKey: ["wordLookup", passage.id, popupWord],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/reading_passages/${passage.id}/word_lookup`,
        { params: { word: popupWord } }
      );
      return res.data;
    },
    enabled: !!popupWord && !highlighted,
    staleTime: Infinity,
    retry: false,
  });

  const popupInfo: WordInfo | null = highlighted
    ? { word: highlighted.word, reading: highlighted.reading, meaning_vi: highlighted.meaning_vi }
    : lookup.data ?? null;

  const handleWordTap = useCallback((word: string, rect: DOMRect) => {
    if (!word.trim()) return;
    setPopupWord(word);
    setAnchorRect(rect);
  }, []);

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Furigana toggle */}
        <button
          onClick={() => setShowFurigana((s) => !s)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showFurigana
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-zinc-300 bg-zinc-50 text-zinc-600"
          }`}
        >
          ふりがな {showFurigana ? "表示中" : "非表示"}
        </button>

        {/* TTS play/pause + speed */}
        <div className="flex items-center gap-1.5 ml-auto">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => tts.setRate(opt.value)}
              disabled={tts.playing}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                tts.rate === opt.value
                  ? "bg-zinc-800 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              } ${tts.playing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt.label}
            </button>
          ))}

          <button
            onClick={tts.playing ? tts.pause : tts.play}
            className="ml-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            {tts.playing ? "⏸ Dừng" : tts.paused ? "▶ Tiếp tục" : "▶ Nghe"}
          </button>

          {(tts.playing || tts.paused) && (
            <button
              onClick={tts.stop}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Passage text                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-bold text-zinc-900 text-base">{passage.title}</h2>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 uppercase">
            {passage.jlpt_level}
          </span>
          {passage.topic && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {passage.topic}
            </span>
          )}
        </div>

        <div className="text-base leading-[2.2] text-zinc-800 select-text">
          {segments.map((seg, i) => {
            if (seg.type === "break") return <br key={i} />;

            const isHighlighted =
              tts.currentCharIndex >= 0 &&
              "plainStart" in seg &&
              tts.currentCharIndex >= seg.plainStart &&
              tts.currentCharIndex < seg.plainStart + (seg.type === "ruby" ? seg.word.length : seg.text.length);

            const baseClass = `cursor-pointer rounded transition-colors ${
              isHighlighted
                ? "bg-yellow-200"
                : "hover:bg-yellow-50"
            }`;

            if (seg.type === "ruby") {
              return (
                <span
                  key={i}
                  className={baseClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWordTap(seg.word, (e.target as HTMLElement).getBoundingClientRect());
                  }}
                >
                  {showFurigana ? (
                    <ruby>
                      {seg.word}
                      <rt className="text-[0.6em] text-zinc-400">{seg.reading}</rt>
                    </ruby>
                  ) : (
                    seg.word
                  )}
                </span>
              );
            }

            return (
              <span
                key={i}
                className={baseClass}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordTap(seg.text, (e.target as HTMLElement).getBoundingClientRect());
                }}
              >
                {seg.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Vocabulary highlights                                               */}
      {/* ------------------------------------------------------------------ */}
      {passage.vocabulary_highlights.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Từ vựng trong bài</h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {passage.vocabulary_highlights.map((v: VocabHighlight, i: number) => (
              <div
                key={i}
                className="flex items-baseline gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-900">{v.word}</span>
                <span className="text-zinc-400 text-xs">（{v.reading}）</span>
                <span className="text-zinc-600 ml-auto text-xs">{v.meaning_vi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Start quiz button                                                    */}
      {/* ------------------------------------------------------------------ */}
      {passage.questions.length > 0 && (
        <button
          onClick={onStartQuiz}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Làm bài kiểm tra →
        </button>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Word popup                                                           */}
      {/* ------------------------------------------------------------------ */}
      {popupWord && (
        <WordPopup
          word={popupWord}
          info={popupInfo}
          loading={lookup.isPending && !highlighted}
          error={lookup.isError ? "Không tra được từ này." : null}
          anchorRect={anchorRect}
          onClose={() => setPopupWord(null)}
        />
      )}
    </div>
  );
}
