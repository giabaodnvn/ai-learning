import React, { useMemo } from "react";

interface DayData {
  date:  string; // "YYYY-MM-DD"
  count: number;
}

interface Props {
  data: DayData[];
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const MONTH_LABELS: Record<number, string> = {
  1: "Th1", 2: "Th2", 3: "Th3", 4: "Th4", 5: "Th5", 6: "Th6",
  7: "Th7", 8: "Th8", 9: "Th9", 10: "Th10", 11: "Th11", 12: "Th12",
};

function cellColor(count: number): string {
  if (count === 0)  return "bg-zinc-100";
  if (count <= 3)   return "bg-green-200";
  if (count <= 7)   return "bg-green-400";
  if (count <= 14)  return "bg-green-600";
  return "bg-green-800";
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Build a 2D grid: weeks (columns) × days-of-week (rows, 0=Sun…6=Sat).
 * Covers the last 365 days aligned to the start of the week.
 */
function buildGrid(data: DayData[]): {
  weeks: Array<Array<{ date: string; count: number; future: boolean }>>;
  monthPositions: Array<{ label: string; colIndex: number }>;
} {
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  const today  = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 364 days ago, aligned to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); // rewind to last Sunday

  const weeks: Array<Array<{ date: string; count: number; future: boolean }>> = [];
  const monthPositions: Array<{ label: string; colIndex: number }> = [];

  let cur         = new Date(start);
  let weekIndex   = 0;
  let lastMonth   = -1;

  while (cur <= today) {
    const week: { date: string; count: number; future: boolean }[] = [];

    for (let d = 0; d < 7; d++) {
      const dateStr = toLocalDateStr(cur);
      const isFuture = cur > today;
      week.push({
        date:   dateStr,
        count:  countMap.get(dateStr) ?? 0,
        future: isFuture,
      });

      const month = cur.getMonth() + 1;
      if (!isFuture && month !== lastMonth && d === 0) {
        monthPositions.push({ label: MONTH_LABELS[month], colIndex: weekIndex });
        lastMonth = month;
      }

      cur.setDate(cur.getDate() + 1);
    }

    weeks.push(week);
    weekIndex++;
  }

  return { weeks, monthPositions };
}

export function ActivityHeatmap({ data }: Props) {
  const { weeks, monthPositions } = useMemo(() => buildGrid(data), [data]);

  const totalDays   = data.reduce((s, d) => s + (d.count > 0 ? 1 : 0), 0);
  const totalCards  = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Hoạt động học tập
        </p>
        <p className="text-xs text-zinc-400">
          {totalDays} ngày · {totalCards.toLocaleString()} thẻ trong năm qua
        </p>
      </div>

      {/* Scrollable heatmap container */}
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: `${weeks.length * 14}px` }}>
          {/* Month labels */}
          <div className="flex mb-1">
            {/* Spacer for day labels */}
            <div className="w-7 shrink-0" />
            <div className="relative flex-1">
              {monthPositions.map(({ label, colIndex }) => (
                <span
                  key={`${label}-${colIndex}`}
                  className="absolute text-[10px] text-zinc-400"
                  style={{ left: `${colIndex * 14}px` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid: day-of-week rows × week columns */}
          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="h-[11px] text-[9px] text-zinc-300 flex items-center justify-end w-6"
                >
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.future ? "" : `${day.date}: ${day.count} thẻ`}
                    className={`h-[11px] w-[11px] rounded-[2px] ${
                      day.future ? "bg-transparent" : cellColor(day.count)
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
        <span>Ít hơn</span>
        {["bg-zinc-100", "bg-green-200", "bg-green-400", "bg-green-600", "bg-green-800"].map(
          (c, i) => (
            <div key={i} className={`h-[11px] w-[11px] rounded-[2px] ${c}`} />
          )
        )}
        <span>Nhiều hơn</span>
      </div>
    </div>
  );
}
