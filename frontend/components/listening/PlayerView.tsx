"use client";

import { useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { ExerciseData } from "./ExerciseCard";

interface Props {
  exercise: ExerciseData;
  onStartQuiz: (speechRate: number) => void;
}

const SPEED_OPTIONS = [
  { rate: 0.75, label: "Chậm" },
  { rate: 1.0,  label: "Bình thường" },
  { rate: 1.25, label: "Nhanh" },
];

export function PlayerView({ exercise, onStartQuiz }: Props) {
  const [showScript, setShowScript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const tts = useTextToSpeech(exercise.script_ja);

  const handlePlay = () => {
    tts.play();
    setHasPlayed(true);
  };

  const handleSetRate = (rate: number) => {
    if (!tts.playing && !tts.paused) {
      tts.setRate(rate);
    }
  };

  const handleStartQuiz = () => {
    onStartQuiz(tts.rate);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{exercise.title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{exercise.topic}</p>
      </div>

      {/* Script display (initially hidden) */}
      {showScript && (
        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200 space-y-2">
          <p className="text-xs font-medium text-zinc-600">Tập luyện nghe</p>
          <p className="text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
            {exercise.script_ja}
          </p>
        </div>
      )}

      {/* Translation (toggle) */}
      {showTranslation && (
        <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 space-y-2">
          <p className="text-xs font-medium text-blue-600">Bản dịch tiếng Việt</p>
          <p className="text-sm leading-relaxed text-blue-900 whitespace-pre-wrap">
            {exercise.script_vi}
          </p>
        </div>
      )}

      {/* Speed control */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-600">Tốc độ nói</p>
        <div className="flex gap-2">
          {SPEED_OPTIONS.map(({ rate, label }) => (
            <button
              key={rate}
              onClick={() => handleSetRate(rate)}
              disabled={tts.playing || tts.paused}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                tts.rate === rate
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          className="flex-1 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
        >
          {tts.playing ? "⏸ Tạm dừng" : tts.paused ? "▶ Tiếp tục" : "▶ Nghe"}
        </button>

        <button
          onClick={() => tts.pause()}
          disabled={!tts.playing}
          className="rounded-lg border border-zinc-300 text-zinc-600 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Tạm dừng
        </button>

        <button
          onClick={() => tts.stop()}
          disabled={!tts.playing && !tts.paused}
          className="rounded-lg border border-zinc-300 text-zinc-600 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Dừng
        </button>
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowScript(!showScript)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            showScript
              ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
              : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {showScript ? "✓ Xem kịch bản" : "Xem kịch bản"}
        </button>

        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            showTranslation
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {showTranslation ? "✓ Xem dịch" : "Xem dịch"}
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-zinc-500 text-center">
        {hasPlayed ? "Đã nghe - Bạn có thể làm bài kiểm tra" : "Hãy nghe ít nhất một lần trước khi làm bài"}
      </div>

      {/* Start quiz button */}
      <button
        onClick={handleStartQuiz}
        disabled={!hasPlayed}
        className="w-full rounded-xl bg-zinc-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Làm bài kiểm tra →
      </button>
    </div>
  );
}
