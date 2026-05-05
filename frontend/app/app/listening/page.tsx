"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ExerciseCard, type ExerciseData } from "@/components/listening/ExerciseCard";
import { PlayerView } from "@/components/listening/PlayerView";
import { ListeningQuiz } from "@/components/listening/ListeningQuiz";
import { ListeningResult } from "@/components/listening/ListeningResult";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIStreamFallback } from "@/components/AIStreamFallback";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerResult {
  correct: boolean;
  correct_index: number;
  explanation_vi: string;
}

type View = "list" | "player" | "quiz" | "result";

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"] as const;
const TOPICS = [
  { label: "Thông báo ga tàu", value: "駅でのアナウンス" },
  { label: "Hội thoại quán cà phê", value: "カフェでの会話" },
  { label: "Hội thoại điện thoại", value: "電話での会話" },
  { label: "Giải thích bài học", value: "授業の説明" },
  { label: "Tin tức", value: "ニュース" },
  { label: "Sinh hoạt hằng ngày", value: "日常会話" },
  { label: "Mua sắm", value: "買い物" },
  { label: "Du lịch", value: "旅行" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ListeningPage() {
  const { user } = useCurrentUser();

  const [view, setView] = useState<View>("list");
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [selected, setSelected] = useState<ExerciseData | null>(null);
  const [quizResults, setQuizResults] = useState<AnswerResult[]>([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Generate form state
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [jlptLevel, setJlptLevel] = useState("");

  const effectiveLevel = jlptLevel || user?.jlpt_level || "n5";

  // -------------------------------------------------------------------------
  // Load exercises on mount / level change
  // -------------------------------------------------------------------------
  const loadExercises = useCallback(async (level: string) => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await api.get("/api/v1/listening_exercises", {
        params: { level },
      });
      setExercises(res.data);
    } catch {
      setListError("Không thể tải danh sách bài luyện nghe.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") loadExercises(effectiveLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLevel, view]);

  // -------------------------------------------------------------------------
  // Generate new exercise
  // -------------------------------------------------------------------------
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return;

    setGenerating(true);
    setGenError(null);

    try {
      const res = await api.post("/api/v1/listening_exercises/generate", {
        jlpt_level: effectiveLevel,
        topic: finalTopic,
      });
      const newExercise: ExerciseData = res.data;
      setExercises((prev) => [newExercise, ...prev]);
      setSelected(newExercise);
      setView("player");
    } catch {
      setGenError("Không thể tạo bài luyện nghe. Vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------
  function openExercise(exercise: ExerciseData) {
    setSelected(exercise);
    setQuizResults([]);
    setView("player");
  }

  function startQuiz(rate: number) {
    setSpeechRate(rate);
    setView("quiz");
  }

  function finishQuiz(results: AnswerResult[], score: number, total: number) {
    setQuizResults(results);
    setQuizScore(score);
    setQuizTotal(total);
    setView("result");
  }

  function goToList() {
    setSelected(null);
    setView("list");
  }

  function listenAgain() {
    setView("player");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // --- Result screen ---
  if (view === "result" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={goToList} label="Danh sách bài luyện nghe" />
        <ListeningResult
          exercise={selected}
          results={quizResults}
          score={quizScore}
          total={quizTotal}
          onListenAgain={listenAgain}
          onNewExercise={goToList}
        />
      </div>
    );
  }

  // --- Quiz screen ---
  if (view === "quiz" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => setView("player")} label="Quay lại nghe" />
        <ErrorBoundary
          fallback={
            <AIStreamFallback
              errorMessage="Không thể tải câu hỏi. Vui lòng thử lại."
              onRetry={() => setView("quiz")}
            />
          }
        >
          <ListeningQuiz
            exercise={selected}
            speechRate={speechRate}
            onFinish={finishQuiz}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // --- Player screen ---
  if (view === "player" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={goToList} label="Danh sách bài luyện nghe" />
        <ErrorBoundary
          fallback={
            <AIStreamFallback
              errorMessage="Không thể tải bài luyện nghe. Vui lòng thử lại."
              onRetry={() => {
                setSelected(null);
                setView("player");
                setSelected(selected);
              }}
            />
          }
        >
          <PlayerView exercise={selected} onStartQuiz={startQuiz} />
        </ErrorBoundary>
      </div>
    );
  }

  // --- List screen ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Nghe hiểu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện nghe tiếng Nhật qua các bài hội thoại, kiểm tra hiểu nội dung.
        </p>
      </div>

      {/* Generate form */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-zinc-700">Tạo bài luyện nghe mới</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Topic preset */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Chủ đề
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
            >
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom topic */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Hoặc nhập tự do
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. 仕事の会議、医者との会話..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Trình độ
            </label>
            <select
              value={jlptLevel}
              onChange={(e) => setJlptLevel(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
            >
              <option value="">
                Theo tài khoản ({user?.jlpt_level?.toUpperCase() ?? "N5"})
              </option>
              {JLPT_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {genError && <p className="text-sm text-red-600">{genError}</p>}

        <button
          type="submit"
          disabled={generating || (!topic && !customTopic.trim())}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "Đang tạo bài luyện nghe…" : "Tạo bài luyện nghe"}
        </button>
      </form>

      {/* Level filter for list */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Lọc theo trình độ:</span>
        {JLPT_LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setJlptLevel(l === effectiveLevel && jlptLevel ? "" : l)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors ${
              effectiveLevel === l
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {listError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </div>
      )}

      {/* Exercise list */}
      {loadingList ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2"
            >
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">
            Chưa có bài luyện nghe nào cho trình độ {effectiveLevel.toUpperCase()}.
            <br />
            Hãy tạo bài luyện nghe mới ở trên!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercises.map((e) => (
            <ExerciseCard key={e.id} exercise={e} onClick={openExercise} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helper component
// ---------------------------------------------------------------------------

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
    >
      ← {label}
    </button>
  );
}
