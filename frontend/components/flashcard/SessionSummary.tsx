"use client";

import { useFlashcardStore } from "@/lib/stores/flashcardStore";
import { GRADE_EMOJI, GRADE_LABELS, GRADE_TILE_COLORS } from "@/lib/flashcard-utils";

interface Props {
  onRestart: () => void;
  onBack?: () => void;
}

// A session can mix card types, so the breakdown uses the vocabulary wording as
// the neutral one rather than a fourth private copy of the four grade labels.
const BREAKDOWN = GRADE_LABELS.vocabulary.map(({ grade, vi }) => ({
  grade,
  label: vi,
  emoji: GRADE_EMOJI[grade],
  color: GRADE_TILE_COLORS[grade],
}));

export function SessionSummary({ onRestart, onBack }: Props) {
  const { sessionStats } = useFlashcardStore();

  const total    = sessionStats.grades.length;
  const correct  = sessionStats.grades.filter((g) => g >= 2).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const trophy = accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📚";
  const message =
    accuracy >= 80 ? "Xuất sắc！すごい！" :
    accuracy >= 50 ? "Tiến bộ tốt！頑張って！" :
    "Cần luyện thêm！もっと頑張れ！";

  return (
    <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2] overflow-hidden shadow-sm">
      {/* Header gradient bar */}
      <div className={`h-1.5 ${accuracy >= 80 ? "bg-gradient-to-r from-amber-400 to-yellow-300" : accuracy >= 50 ? "bg-gradient-to-r from-blue-500 to-indigo-400" : "bg-gradient-to-r from-zinc-400 to-stone-300"}`} />

      <div className="p-10 text-center space-y-5">
        <div>
          <p className="text-5xl mb-3">{trophy}</p>
          <h2 className="text-xl font-bold text-zinc-900">{message}</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {total} thẻ đã ôn · Độ chính xác <span className="font-bold text-zinc-700">{accuracy}%</span>
          </p>
        </div>

        {/* Accuracy ring (simple) */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-3xl font-black text-zinc-900">{correct}</span>
          <span className="text-sm text-zinc-400">/ {total} đúng</span>
        </div>

        {/* Grade breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {BREAKDOWN.map(({ label, color, grade, emoji }) => (
            <div key={grade} className={`rounded-xl py-3.5 px-2 ${color}`}>
              <p className="text-lg">{emoji}</p>
              <p className="text-xl font-bold mt-0.5">
                {sessionStats.grades.filter((g) => g === grade).length}
              </p>
              <p className="text-[11px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-stone-50 transition-colors"
            >
              Đổi chế độ
            </button>
          )}
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:from-indigo-800 hover:to-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            Ôn tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}
