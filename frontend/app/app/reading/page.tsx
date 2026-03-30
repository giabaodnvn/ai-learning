"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PassageCard, PassageData } from "@/components/reading/PassageCard";
import { ReaderView } from "@/components/reading/ReaderView";
import { QuizSection } from "@/components/reading/QuizSection";
import { ResultScreen } from "@/components/reading/ResultScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerResult {
  correct: boolean;
  correct_index: number;
  explanation_vi: string;
}

type View = "list" | "reading" | "quiz" | "result";

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"] as const;
const TOPICS = [
  { label: "Sinh hoạt hằng ngày",  value: "日常生活" },
  { label: "Thực phẩm & ẩm thực",  value: "食べ物と料理" },
  { label: "Du lịch",              value: "旅行" },
  { label: "Mua sắm",              value: "買い物" },
  { label: "Sức khỏe",             value: "健康" },
  { label: "Thiên nhiên & thời tiết", value: "自然と天気" },
  { label: "Văn hóa Nhật Bản",     value: "日本文化" },
  { label: "Công việc",            value: "仕事" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReadingPage() {
  const { user } = useCurrentUser();

  const [view,          setView]          = useState<View>("list");
  const [passages,      setPassages]      = useState<PassageData[]>([]);
  const [selected,      setSelected]      = useState<PassageData | null>(null);
  const [quizResults,   setQuizResults]   = useState<AnswerResult[]>([]);

  const [loadingList,   setLoadingList]   = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [listError,     setListError]     = useState<string | null>(null);
  const [genError,      setGenError]      = useState<string | null>(null);

  // Generate form state
  const [topic,      setTopic]      = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [jlptLevel,  setJlptLevel]  = useState("");

  const effectiveLevel = jlptLevel || user?.jlpt_level || "n5";

  // -------------------------------------------------------------------------
  // Load passage list on mount / level change
  // -------------------------------------------------------------------------
  const loadPassages = useCallback(async (level: string) => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await api.get("/api/v1/reading_passages", {
        params: { level },
      });
      setPassages(res.data);
    } catch {
      setListError("Không thể tải danh sách bài đọc.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") loadPassages(effectiveLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLevel, view]);

  // -------------------------------------------------------------------------
  // Generate new passage
  // -------------------------------------------------------------------------
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return;

    setGenerating(true);
    setGenError(null);

    try {
      const res = await api.post("/api/v1/reading_passages/generate", {
        jlpt_level: effectiveLevel,
        topic:      finalTopic,
      });
      const newPassage: PassageData = res.data;
      setPassages((prev) => [newPassage, ...prev]);
      setSelected(newPassage);
      setView("reading");
    } catch {
      setGenError("Không thể tạo bài đọc. Vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------
  function openPassage(passage: PassageData) {
    setSelected(passage);
    setQuizResults([]);
    setView("reading");
  }

  function startQuiz() {
    setView("quiz");
  }

  function finishQuiz(results: AnswerResult[]) {
    setQuizResults(results);
    setView("result");
  }

  function goToList() {
    setSelected(null);
    setView("list");
  }

  function readAgain() {
    setView("reading");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // --- Result screen ---
  if (view === "result" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={goToList} label="Danh sách bài đọc" />
        <ResultScreen
          passage={selected}
          results={quizResults}
          onReadAgain={readAgain}
          onNewPassage={goToList}
        />
      </div>
    );
  }

  // --- Quiz screen ---
  if (view === "quiz" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => setView("reading")} label="Quay lại bài đọc" />
        <QuizSection passage={selected} onFinish={finishQuiz} />
      </div>
    );
  }

  // --- Reader screen ---
  if (view === "reading" && selected) {
    return (
      <div className="space-y-4">
        <BackButton onClick={goToList} label="Danh sách bài đọc" />
        <ReaderView passage={selected} onStartQuiz={startQuiz} />
      </div>
    );
  }

  // --- List screen ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Đọc hiểu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện đọc tiếng Nhật kèm TTS, tra từ nhanh và kiểm tra hiểu bài.
        </p>
      </div>

      {/* Generate form */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-zinc-700">Tạo bài đọc mới</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Topic preset */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Chủ đề</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
            >
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
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
              placeholder="e.g. 桜の季節、通勤電車..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Trình độ</label>
            <select
              value={jlptLevel}
              onChange={(e) => setJlptLevel(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white outline-none focus:border-zinc-500"
            >
              <option value="">Theo tài khoản ({user?.jlpt_level?.toUpperCase() ?? "N5"})</option>
              {JLPT_LEVELS.map((l) => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {genError && (
          <p className="text-sm text-red-600">{genError}</p>
        )}

        <button
          type="submit"
          disabled={generating || (!topic && !customTopic.trim())}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "Đang tạo bài đọc…" : "Tạo bài đọc"}
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

      {/* Passage list */}
      {loadingList ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : passages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">
            Chưa có bài đọc nào cho trình độ {effectiveLevel.toUpperCase()}.
            <br />
            Hãy tạo bài đọc mới ở trên!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {passages.map((p) => (
            <PassageCard key={p.id} passage={p} onClick={openPassage} />
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
