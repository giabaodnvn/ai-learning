import React from "react";

interface Props {
  count: number;
  studiedToday: boolean;
}

export function StreakBadge({ count, studiedToday }: Props) {
  const isHot    = count >= 7;
  const isEmpty  = count === 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-1">
      <p className="text-xs text-zinc-500">Chuỗi ngày học</p>

      <div className="flex items-center gap-2 mt-1">
        {/* Flame icon — animated when hot */}
        <span
          className={`text-2xl select-none ${
            isEmpty
              ? "grayscale opacity-40"
              : isHot
              ? "animate-bounce"
              : ""
          }`}
          role="img"
          aria-label="flame"
        >
          🔥
        </span>

        <span className={`text-3xl font-bold tabular-nums ${
          isEmpty ? "text-zinc-400" : isHot ? "text-orange-500" : "text-zinc-900"
        }`}>
          {count}
        </span>

        <span className="text-sm text-zinc-500 mt-1">ngày</span>
      </div>

      <p className={`text-xs mt-0.5 ${studiedToday ? "text-green-600" : "text-zinc-400"}`}>
        {studiedToday ? "Đã học hôm nay" : "Chưa học hôm nay"}
      </p>

      {isHot && (
        <p className="text-xs text-orange-500 font-medium">
          Tuyệt vời! Giữ vững chuỗi ngày!
        </p>
      )}
    </div>
  );
}
