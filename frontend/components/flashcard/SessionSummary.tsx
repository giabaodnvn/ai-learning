"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useFlashcardStore } from "@/lib/stores/flashcardStore";

interface Props {
  onRestart: () => void;
}

const GRADE_LABELS = [
  { label: "Quên", color: "bg-red-50 text-red-700", grade: 0 },
  { label: "Khó",  color: "bg-amber-50 text-amber-700", grade: 1 },
  { label: "Ổn",   color: "bg-blue-50 text-blue-700", grade: 2 },
  { label: "Dễ",   color: "bg-green-50 text-green-700", grade: 3 },
] as const;

export function SessionSummary({ onRestart }: Props) {
  const queryClient = useQueryClient();
  const { sessionStats } = useFlashcardStore();

  const total    = sessionStats.grades.length;
  const correct  = sessionStats.grades.filter((g) => g >= 2).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  function handleRestart() {
    queryClient.invalidateQueries({ queryKey: ["flashcards-due"] });
    onRestart();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-5">
      <p className="text-5xl">
        {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📚"}
      </p>

      <div>
        <h2 className="text-xl font-bold text-zinc-900">
          Phiên ôn tập hoàn thành!
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {total} thẻ đã ôn · Đúng {correct}/{total} ({accuracy}%)
        </p>
      </div>

      {/* Grade breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {GRADE_LABELS.map(({ label, color, grade }) => (
          <div key={grade} className={`rounded-lg py-3 ${color}`}>
            <p className="text-2xl font-bold">
              {sessionStats.grades.filter((g) => g === grade).length}
            </p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleRestart}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        Ôn tập tiếp
      </button>
    </div>
  );
}
