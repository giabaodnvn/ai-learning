import React from "react";
import { LEVELS_META } from "@/lib/levels";

interface LevelData {
  total:   number;
  learned: number;
  percent: number;
}

interface Props {
  progress: Record<string, LevelData>;
}

export function JLPTProgressBar({ progress }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Tiến độ theo cấp độ
      </p>

      {LEVELS_META.map(({ value, labelVi, barClass }) => {
        const data = progress[value];
        if (!data) return null;
        const pct = data.percent;

        return (
          <div key={value} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">{labelVi}</span>
              <span className="text-zinc-500 tabular-nums">
                {data.learned.toLocaleString()} / {data.total.toLocaleString()}
                <span className="ml-1.5 font-semibold text-zinc-700">{pct}%</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
