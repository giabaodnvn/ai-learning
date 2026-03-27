"use client";

import { useState, Fragment } from "react";

export interface Correction {
  original: string;
  corrected: string;
  explanation_vi: string;
}

export interface NewWord {
  word: string;
  reading: string;
  meaning_vi: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  corrections?: Correction[];
  new_words?: NewWord[];
  translation_vi?: string;
}

// Parse 漢字《ふりがな》 → <ruby> elements
function renderFurigana(text: string): React.ReactNode {
  const segments = text.split(/([\u3400-\u9fff々〆〱-〵]+《[^》]+》)/);
  return segments.map((seg, i) => {
    const m = seg.match(/^([\u3400-\u9fff々〆〱-〵]+)《([^》]+)》$/);
    if (m) {
      return (
        <ruby key={i}>
          {m[1]}
          <rt className="text-[0.55em] text-zinc-500">{m[2]}</rt>
        </ruby>
      );
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

function speakJapanese(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Strip furigana markup for plain text (used for TTS)
function stripFurigana(text: string): string {
  return text.replace(/《[^》]+》/g, "");
}

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);

  const isUser      = message.role === "user";
  const hasCorrections = (message.corrections?.length ?? 0) > 0;
  const hasNewWords    = (message.new_words?.length ?? 0) > 0;
  const hasTranslation = !!message.translation_vi;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] space-y-1.5 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-zinc-900 text-white rounded-br-sm"
              : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
          }`}
        >
          {isStreaming && !message.content ? (
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          ) : isUser ? (
            message.content
          ) : (
            renderFurigana(message.content)
          )}
        </div>

        {/* Action row (AI messages only) */}
        {!isUser && !isStreaming && (
          <div className="flex items-center gap-2 px-1">
            {/* TTS */}
            <button
              onClick={() => speakJapanese(stripFurigana(message.content))}
              className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Nghe phát âm"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" />
                <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89z" />
                <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325L6.188 3.61a.5.5 0 0 1 .53-.06z" />
              </svg>
            </button>

            {/* Translation toggle */}
            {hasTranslation && (
              <button
                onClick={() => setShowTranslation((v) => !v)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  showTranslation
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Dịch
              </button>
            )}

            {/* Corrections toggle */}
            {(hasCorrections || hasNewWords) && (
              <button
                onClick={() => setShowCorrections((v) => !v)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  showCorrections
                    ? "bg-amber-100 text-amber-700"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {hasCorrections ? `Sửa lỗi (${message.corrections!.length})` : "Từ mới"}
              </button>
            )}
          </div>
        )}

        {/* Translation */}
        {showTranslation && message.translation_vi && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 leading-relaxed">
            {message.translation_vi}
          </div>
        )}

        {/* Corrections + New words panel */}
        {showCorrections && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3 text-xs">
            {hasCorrections && (
              <div className="space-y-1.5">
                <p className="font-semibold text-amber-800">Sửa lỗi</p>
                {message.corrections!.map((c, i) => (
                  <div key={i} className="space-y-0.5">
                    <div>
                      <span className="line-through text-red-500">{c.original}</span>
                      <span className="text-zinc-500 mx-1">→</span>
                      <span className="text-green-700 font-medium">{c.corrected}</span>
                    </div>
                    <p className="text-amber-700">{c.explanation_vi}</p>
                  </div>
                ))}
              </div>
            )}

            {hasNewWords && (
              <div className="space-y-1">
                <p className="font-semibold text-indigo-800">Từ mới</p>
                {message.new_words!.map((w, i) => (
                  <p key={i} className="text-indigo-700">
                    <span className="font-medium">{w.word}</span>
                    {w.reading && <span className="text-indigo-500">（{w.reading}）</span>}
                    <span className="text-zinc-500"> — </span>
                    {w.meaning_vi}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
