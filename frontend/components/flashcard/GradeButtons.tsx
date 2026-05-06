"use client";

import { GRADE_LABELS } from "@/lib/flashcard-utils";
import type { FlashCard } from "@/lib/flashcard-utils";

interface Props {
  cardType: FlashCard["cardType"];
  onGrade: (grade: number) => void;
  disabled?: boolean;
}

export function GradeButtons({ cardType, onGrade, disabled }: Props) {
  const grades = GRADE_LABELS[cardType];
  return (
    <div>
      <p className="text-xs text-center text-zinc-400 mb-3 tracking-wide">
        どのくらい覚えましたか？ — Bạn nhớ ở mức nào?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {grades.map(({ grade, ja, vi, color }) => (
          <button
            key={grade}
            onClick={() => onGrade(grade)}
            disabled={disabled}
            className={`rounded-xl border px-2 py-3.5 text-center transition-all hover:scale-[1.03] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${color}`}
          >
            <p className="text-sm font-bold leading-tight">{ja}</p>
            <p className="text-[11px] mt-1 opacity-75">{vi}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
