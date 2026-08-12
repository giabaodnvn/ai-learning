"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { BlankSentence } from "./BlankSentence";
import { ExerciseOptions } from "./ExerciseOptions";
import { ExerciseSkeleton } from "./ExerciseSkeleton";

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

  if (loading) return <ExerciseSkeleton />;

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
      <BlankSentence text={exercise.sentence_with_blank} />

      <ExerciseOptions
        options={exercise.options}
        answerIndex={exercise.answer_index}
        selectedIndex={selected}
        answered={answered}
        onSelect={handleSelect}
        layout="grid"
      />

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
