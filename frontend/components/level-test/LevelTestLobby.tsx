"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TestSummary, AttemptSummary } from "./types";
import { JLPT_LEVELS } from "@/types/quiz";
import { LEVEL_LABEL_VI } from "@/lib/levels";

interface LobbyData {
  level: string;
  next_level: string | null;
  tests: TestSummary[];
  history: AttemptSummary[];
  best_score: number | null;
  passed_before: boolean;
}

interface Props {
  userLevel: string;
  onStartTest: (testId: number) => void;
}

export function LevelTestLobby({ userLevel, onStartTest }: Props) {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState(userLevel);

  // Keyed on the level so switching levels can't let a slow earlier response
  // overwrite a newer one (the previous manual fetch had that race).
  const { data, isLoading, isError } = useQuery<LobbyData>({
    queryKey: ["levelTests", selectedLevel],
    queryFn: async () => {
      const res = await api.get("/api/v1/level_tests", { params: { level: selectedLevel } });
      return res.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/level_tests/generate", { level: selectedLevel });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levelTests", selectedLevel] }),
  });

  const loading = isLoading;
  const generating = generateMutation.isPending;
  const error = isError
    ? "Không thể tải dữ liệu. Vui lòng thử lại."
    : generateMutation.isError
      ? "Không thể tạo bài test. Vui lòng thử lại."
      : null;

  function handleGenerate() {
    generateMutation.mutate();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Kiểm tra trình độ</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Làm bài test như kỳ thi JLPT thật. Pass 70% để thăng lên cấp tiếp theo.
        </p>
      </div>

      {/* Level tabs */}
      <div className="flex gap-2 flex-wrap">
        {JLPT_LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setSelectedLevel(l)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase transition-colors ${
              selectedLevel === l
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {l.toUpperCase()}
            {l === userLevel && (
              <span className="ml-1 text-[10px] opacity-60">(bạn)</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 mb-2" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : data && (
        <>
          {/* Level info banner */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-700">
                {LEVEL_LABEL_VI[selectedLevel] ?? selectedLevel.toUpperCase()}
              </div>
              {data.next_level ? (
                <div className="text-xs text-zinc-500 mt-0.5">
                  Pass bài test → thăng lên{" "}
                  <span className="font-semibold text-zinc-700">
                    {data.next_level.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 mt-0.5">N1 là trình độ cao nhất</div>
              )}
            </div>
            {data.best_score !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold text-zinc-900">{data.best_score}</div>
                <div className="text-xs text-zinc-500">điểm cao nhất</div>
              </div>
            )}
          </div>

          {/* Available tests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">Bài test sẵn có</h2>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {generating ? "Đang tạo…" : "+ Tạo bài test mới"}
              </button>
            </div>

            {data.tests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  Chưa có bài test nào. Nhấn &quot;+ Tạo bài test mới&quot; để bắt đầu!
                </p>
              </div>
            ) : (
              data.tests.map((test) => (
                <TestCard key={test.id} test={test} onStart={() => onStartTest(test.id)} />
              ))
            )}
          </div>

          {/* Attempt history */}
          {data.history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-700">Lịch sử làm bài</h2>
              <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-100">
                {data.history.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} total={data.tests[0]?.total_questions ?? 0} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TestCard({ test, onStart }: { test: TestSummary; onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-800 truncate">{test.title}</div>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          <span>{test.total_questions} câu</span>
          <span>·</span>
          <span>Cần {test.pass_score} câu đúng</span>
          <span>·</span>
          <span>{test.time_limit_min} phút</span>
        </div>
      </div>
      <button
        onClick={onStart}
        className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
      >
        Làm bài
      </button>
    </div>
  );
}

function AttemptRow({ attempt, total }: { attempt: AttemptSummary; total: number }) {
  const pct = total > 0 ? Math.round((attempt.score / (attempt.total || total)) * 100) : attempt.accuracy;
  const date = new Date(attempt.taken_at).toLocaleDateString("vi-VN");
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            attempt.passed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {attempt.passed ? "PASS" : "FAIL"}
        </span>
        <span className="text-zinc-700">
          {attempt.score}/{attempt.total} ({pct}%)
        </span>
        {attempt.level_after && (
          <span className="text-xs text-emerald-600 font-semibold">
            → {attempt.level_after.toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-zinc-400 text-xs">{date}</span>
    </div>
  );
}
