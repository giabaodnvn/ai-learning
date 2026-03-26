"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Exercise {
  sentence_with_blank: string;
  options: string[];
  answer_index: number;
  explanation_vi: string;
}

interface FillInBlankProps {
  grammarPointId: number;
}

export default function FillInBlank({ grammarPointId }: FillInBlankProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function loadExercise() {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await api.post(`/api/v1/grammar_points/${grammarPointId}/generate_exercise`);
      setExercise(res.data);
    } catch {
      setError("Không thể tạo bài tập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(idx: number) {
    if (selected !== null) return; // already answered
    setSelected(idx);
  }

  const answered = selected !== null;

  // Replace ___ in sentence with a styled blank indicator
  function renderSentence(sentence: string) {
    const parts = sentence.split("___");
    return parts.map((part, i) => (
      <span key={i}>
        {part}
        {i < parts.length - 1 && (
          <span className="inline-block min-w-[60px] border-b-2 border-zinc-400 mx-1 align-bottom" />
        )}
      </span>
    ));
  }

  if (!exercise && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-zinc-500">Nhấn để tạo bài tập điền vào chỗ trống</p>
        <button
          onClick={loadExercise}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Tạo bài tập
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <div className="h-6 animate-pulse rounded bg-zinc-100 w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 py-4">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={loadExercise} className="text-sm text-zinc-600 underline">
          Thử lại
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="space-y-4">
      {/* Sentence */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-lg text-zinc-800 leading-relaxed">{renderSentence(exercise.sentence_with_blank)}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {exercise.options.map((opt, idx) => {
          const isCorrect = idx === exercise.answer_index;
          const isSelected = idx === selected;

          let cls =
            "rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ";

          if (!answered) {
            cls += "border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 cursor-pointer";
          } else if (isCorrect) {
            cls += "border-green-400 bg-green-50 text-green-800";
          } else if (isSelected) {
            cls += "border-red-400 bg-red-50 text-red-800";
          } else {
            cls += "border-zinc-200 bg-white text-zinc-400";
          }

          return (
            <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={answered}>
              <span className="mr-2 text-xs text-zinc-400">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
              {answered && isCorrect && " ✓"}
              {answered && isSelected && !isCorrect && " ✗"}
            </button>
          );
        })}
      </div>

      {/* Explanation after answer */}
      {answered && (
        <div
          className={`rounded-xl border p-4 text-sm leading-relaxed ${
            selected === exercise.answer_index
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="font-semibold mb-1">
            {selected === exercise.answer_index ? "Chính xác!" : `Đáp án đúng: ${exercise.options[exercise.answer_index]}`}
          </p>
          <p>{exercise.explanation_vi}</p>
        </div>
      )}

      {/* New exercise button */}
      {answered && (
        <button
          onClick={loadExercise}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Bài tập mới
        </button>
      )}
    </div>
  );
}
