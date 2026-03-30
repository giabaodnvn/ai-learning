import React from "react";

interface Props {
  learned:     number;
  dueToday:    number;
  accuracy:    number | null; // null = no data yet
}

function StatItem({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?:  string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color ?? "text-zinc-900"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export function VocabStats({ learned, dueToday, accuracy }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
        Thẻ học
      </p>

      <div className="grid grid-cols-3 gap-4">
        <StatItem
          label="Đã thuộc"
          value={learned.toLocaleString()}
          sub="tổng thẻ"
        />
        <StatItem
          label="Đến hạn hôm nay"
          value={dueToday.toLocaleString()}
          sub="thẻ cần ôn"
          color={dueToday > 0 ? "text-amber-600" : "text-zinc-900"}
        />
        <StatItem
          label="Độ chính xác"
          value={accuracy !== null ? `${accuracy}%` : "—"}
          sub="7 ngày qua"
          color={
            accuracy === null ? "text-zinc-400" :
            accuracy >= 80 ? "text-green-600" :
            accuracy >= 60 ? "text-amber-600" : "text-red-500"
          }
        />
      </div>

      {/* Accuracy bar */}
      {accuracy !== null && (
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                accuracy >= 80 ? "bg-green-400" : accuracy >= 60 ? "bg-amber-400" : "bg-red-400"
              }`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
