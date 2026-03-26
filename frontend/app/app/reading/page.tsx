"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface VocabHighlight {
  word: string;
  reading: string;
  meaning_vi: string;
}

interface Question {
  question: string;
  options: string[];
  answer_index: number;
}

interface Passage {
  title: string;
  content: string;
  vocabulary_highlights: VocabHighlight[];
  questions: Question[];
}

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"];

export default function ReadingPage() {
  const { user } = useCurrentUser();

  const [topic, setTopic] = useState("");
  const [jlptLevel, setJlptLevel] = useState<string>("");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const effectiveLevel = jlptLevel || user?.jlpt_level || "n5";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setPassage(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const res = await api.post("/api/v1/reading/generate", {
        topic: topic.trim(),
        jlpt_level: effectiveLevel,
      });
      setPassage(res.data);
    } catch {
      setError("Không thể tạo bài đọc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(qIndex: number, optIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  function handleSubmit() {
    if (!passage) return;
    const allAnswered = passage.questions.every((_, i) => answers[i] !== undefined);
    if (!allAnswered) return;
    setSubmitted(true);
  }

  const score = passage
    ? passage.questions.filter((q, i) => answers[i] === q.answer_index).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Đọc hiểu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI tạo bài đọc tiếng Nhật kèm câu hỏi trắc nghiệm theo trình độ của bạn.
        </p>
      </div>

      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Chủ đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: 日本の食文化、桜の季節、通勤電車..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Trình độ
            </label>
            <select
              value={jlptLevel}
              onChange={(e) => setJlptLevel(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 bg-white"
            >
              <option value="">Theo tài khoản ({user?.jlpt_level?.toUpperCase() ?? "N5"})</option>
              {JLPT_LEVELS.map((l) => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tạo bài đọc..." : "Tạo bài đọc"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-zinc-100" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-zinc-100" style={{ width: `${95 - i * 5}%` }} />
          ))}
        </div>
      )}

      {passage && (
        <div className="space-y-6">
          {/* Passage */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-zinc-900">{passage.title}</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {effectiveLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-sm leading-loose text-zinc-800 whitespace-pre-wrap">
              {passage.content}
            </p>
          </div>

          {/* Vocabulary */}
          {passage.vocabulary_highlights.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-zinc-700 mb-3">
                Từ vựng trong bài
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {passage.vocabulary_highlights.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-baseline gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900">{v.word}</span>
                    <span className="text-zinc-400 text-xs">（{v.reading}）</span>
                    <span className="text-zinc-600 ml-auto">{v.meaning_vi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                Câu hỏi trắc nghiệm
              </h2>
              {submitted && (
                <span className={`text-sm font-bold ${score >= 3 ? "text-green-600" : "text-red-600"}`}>
                  {score}/{passage.questions.length} câu đúng
                </span>
              )}
            </div>

            {passage.questions.map((q, qi) => (
              <div key={qi} className="space-y-2">
                <p className="text-sm font-medium text-zinc-800">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    const isCorrect = submitted && oi === q.answer_index;
                    const isWrong = submitted && isSelected && oi !== q.answer_index;

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, oi)}
                        disabled={submitted}
                        className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                          isCorrect
                            ? "border-green-400 bg-green-50 text-green-800"
                            : isWrong
                            ? "border-red-400 bg-red-50 text-red-800"
                            : isSelected
                            ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white disabled:cursor-not-allowed"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={passage.questions.some((_, i) => answers[i] === undefined)}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Nộp bài
              </button>
            ) : (
              <button
                onClick={() => {
                  setPassage(null);
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Tạo bài đọc mới
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
