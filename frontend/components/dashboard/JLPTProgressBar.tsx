import React from "react";

interface LevelData {
  total:   number;
  learned: number;
  percent: number;
}

interface Props {
  progress: Record<string, LevelData>;
}

const LEVEL_COLORS: Record<string, string> = {
  n5: "bg-green-400",
  n4: "bg-teal-400",
  n3: "bg-blue-400",
  n2: "bg-violet-400",
  n1: "bg-red-400",
};

const LEVEL_LABELS: Record<string, string> = {
  n5: "N5 – Sơ cấp",
  n4: "N4 – Sơ trung",
  n3: "N3 – Trung cấp",
  n2: "N2 – Trung cao",
  n1: "N1 – Cao cấp",
};

export function JLPTProgressBar({ progress }: Props) {
  const levels = ["n5", "n4", "n3", "n2", "n1"];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Tiến độ theo cấp độ
      </p>

      {levels.map((lvl) => {
        const data = progress[lvl];
        if (!data) return null;
        const bar   = LEVEL_COLORS[lvl];
        const label = LEVEL_LABELS[lvl];
        const pct   = data.percent;

        return (
          <div key={lvl} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">{label}</span>
              <span className="text-zinc-500 tabular-nums">
                {data.learned.toLocaleString()} / {data.total.toLocaleString()}
                <span className="ml-1.5 font-semibold text-zinc-700">{pct}%</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
