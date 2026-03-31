"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StreakBadge }      from "@/components/dashboard/StreakBadge";
import { VocabStats }       from "@/components/dashboard/VocabStats";
import { ActivityHeatmap }  from "@/components/dashboard/ActivityHeatmap";
import { JLPTProgressBar }  from "@/components/dashboard/JLPTProgressBar";
import { WeeklyReport }     from "@/components/dashboard/WeeklyReport";
import { ErrorBoundary }    from "@/components/ErrorBoundary";

interface DashboardData {
  streak_count:     number;
  studied_today:    boolean;
  vocab_learned:    number;
  vocab_due_today:  number;
  accuracy_7days:   number | null;
  jlpt_progress:    Record<string, { total: number; learned: number; percent: number }>;
  activity_heatmap: { date: string; count: number }[];
}

interface WeeklyReportData {
  report:       string | null;
  generated_at: string | null;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-100 ${className}`} />;
}

export function DashboardStats() {
  const [stats,   setStats]   = useState<DashboardData | null>(null);
  const [report,  setReport]  = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dashboard"),
      api.get("/api/v1/dashboard/weekly_report"),
    ])
      .then(([statsRes, reportRes]) => {
        setStats(statsRes.data);
        setReport(reportRes.data);
      })
      .catch(() => {/* silent — user sees skeletons */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-36" />
        <Skeleton className="h-44" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (!stats) return null;

  // Count studied days in last 7 for weekly report unlock logic
  const now        = new Date();
  const weekStart  = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const studiedDaysThisWeek = stats.activity_heatmap.filter(
    (d) => d.date >= weekStartStr && d.count > 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Row 1: Streak + Vocab stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StreakBadge
          count={stats.streak_count}
          studiedToday={stats.studied_today}
        />
        <VocabStats
          learned={stats.vocab_learned}
          dueToday={stats.vocab_due_today}
          accuracy={stats.accuracy_7days}
        />
      </div>

      {/* Activity heatmap */}
      <ActivityHeatmap data={stats.activity_heatmap} />

      {/* JLPT progress */}
      <JLPTProgressBar progress={stats.jlpt_progress} />

      {/* Weekly report — wrapped in ErrorBoundary since it renders AI markdown */}
      <ErrorBoundary
        fallback={
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Không thể tải báo cáo tuần. Vui lòng tải lại trang.
          </div>
        }
      >
        <WeeklyReport
          report={report?.report ?? null}
          generatedAt={report?.generated_at ?? null}
          studiedDays={studiedDaysThisWeek}
        />
      </ErrorBoundary>
    </div>
  );
}
