"use client";

interface Props {
  onGrade: (grade: number) => void;
  disabled?: boolean;
}

const GRADES = [
  {
    grade: 0,
    ja: "また",
    vi: "Quên rồi",
    color:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50",
  },
  {
    grade: 1,
    ja: "難しい",
    vi: "Khó",
    color:
      "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50",
  },
  {
    grade: 2,
    ja: "良い",
    vi: "Ổn",
    color:
      "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50",
  },
  {
    grade: 3,
    ja: "簡単",
    vi: "Dễ",
    color:
      "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50",
  },
] as const;

export function GradeButtons({ onGrade, disabled }: Props) {
  return (
    <div>
      <p className="text-xs text-center text-zinc-400 mb-3">
        Bạn nhớ từ này ở mức nào?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {GRADES.map(({ grade, ja, vi, color }) => (
          <button
            key={grade}
            onClick={() => onGrade(grade)}
            disabled={disabled}
            className={`rounded-xl border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed ${color}`}
          >
            <p className="text-sm font-bold">{ja}</p>
            <p className="text-xs mt-0.5 opacity-80">{vi}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
