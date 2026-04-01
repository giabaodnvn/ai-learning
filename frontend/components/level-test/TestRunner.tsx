"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import type { LevelTestInfo, Answer, SubmitResult } from "./types";

interface Props {
  testId: number;
  onResult: (result: SubmitResult) => void;
  onCancel: () => void;
}

export function TestRunner({ testId, onResult, onCancel }: Props) {
  const [test,        setTest]        = useState<LevelTestInfo | null>(null);
  const [answers,     setAnswers]     = useState<Map<string, Answer>>(new Map());
  const [sectionIdx,  setSectionIdx]  = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load test
  useEffect(() => {
    api.get(`/api/v1/level_tests/${testId}`)
      .then((res) => {
        setTest(res.data);
        setTimeLeft(res.data.time_limit_min * 60);
      })
      .catch(() => setError("Không thể tải bài test."))
      .finally(() => setLoading(false));
  }, [testId]);

  // Countdown timer
  useEffect(() => {
    if (!test || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test]);

  const handleAutoSubmit = useCallback(async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/level_tests/${test.id}/submit`, {
        answers: Array.from(answers.values()),
      });
      onResult(res.data);
    } catch {
      setError("Nộp bài thất bại. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }, [test, answers, onResult]);

  async function handleSubmit() {
    if (!test) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    try {
      const res = await api.post(`/api/v1/level_tests/${test.id}/submit`, {
        answers: Array.from(answers.values()),
      });
      onResult(res.data);
    } catch {
      setError("Nộp bài thất bại. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  function answerKey(sectionIndex: number, questionId: number) {
    return `${sectionIndex}-${questionId}`;
  }

  function setAnswer(sectionIndex: number, questionId: number, answerIndex: number) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(answerKey(sectionIndex, questionId), { question_id: questionId, section_index: sectionIndex, answer_index: answerIndex });
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Loading / error
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-zinc-500">Đang tải bài test…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={onCancel} className="text-sm text-zinc-600 underline">Quay lại</button>
      </div>
    );
  }

  if (!test) return null;

  const section  = test.sections[sectionIdx];
  const question = section.questions[questionIdx];
  const totalQuestions = test.sections.reduce((s, sec) => s + sec.questions.length, 0);
  const answeredCount  = answers.size;

  // Progress: flat question index
  let flatIndex = 0;
  for (let si = 0; si < sectionIdx; si++) flatIndex += test.sections[si].questions.length;
  flatIndex += questionIdx;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const timeWarning = timeLeft <= 120; // last 2 minutes

  const currentAnswer = answers.get(answerKey(sectionIdx, question.id));

  function goNext() {
    if (questionIdx < section.questions.length - 1) {
      setQuestionIdx((i) => i + 1);
    } else if (sectionIdx < test!.sections.length - 1) {
      setSectionIdx((i) => i + 1);
      setQuestionIdx(0);
    }
  }

  function goPrev() {
    if (questionIdx > 0) {
      setQuestionIdx((i) => i - 1);
    } else if (sectionIdx > 0) {
      const prevSec = test!.sections[sectionIdx - 1];
      setSectionIdx((i) => i - 1);
      setQuestionIdx(prevSec.questions.length - 1);
    }
  }

  const isLast = sectionIdx === test.sections.length - 1 && questionIdx === section.questions.length - 1;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-3">
        <div className="text-sm font-semibold text-zinc-700 truncate max-w-[40%]">{test.title}</div>
        <div className={`text-lg font-mono font-bold ${timeWarning ? "text-red-600" : "text-zinc-800"}`}>
          {minutes}:{seconds}
        </div>
        <button
          onClick={() => setConfirmQuit(true)}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Thoát
        </button>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {section.name_vi} — câu {questionIdx + 1}/{section.questions.length}
          </span>
          <span>{answeredCount}/{totalQuestions} đã trả lời</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-100">
          <div
            className="h-1.5 rounded-full bg-zinc-900 transition-all"
            style={{ width: `${((flatIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Section nav pills */}
      <div className="flex gap-2 flex-wrap">
        {test.sections.map((sec, si) => (
          <button
            key={si}
            onClick={() => { setSectionIdx(si); setQuestionIdx(0); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              si === sectionIdx
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            {sec.name_vi}
          </button>
        ))}
      </div>

      {/* Passage (if reading section) */}
      {section.passage && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
          {section.passage}
        </div>
      )}

      {/* Question card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="text-sm font-semibold text-zinc-800 leading-relaxed">
          <span className="text-zinc-400 mr-2">Q{flatIndex + 1}.</span>
          {question.question}
        </div>

        <div className="space-y-2">
          {question.options.map((opt, oi) => {
            const selected = currentAnswer?.answer_index === oi;
            return (
              <button
                key={oi}
                onClick={() => setAnswer(sectionIdx, question.id, oi)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={sectionIdx === 0 && questionIdx === 0}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
        >
          ← Trước
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Đang nộp…" : "Nộp bài"}
          </button>
        ) : (
          <button
            onClick={goNext}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
          >
            Tiếp →
          </button>
        )}
      </div>

      {/* Quick answer grid */}
      <QuestionGrid test={test} answers={answers} sectionIdx={sectionIdx} questionIdx={questionIdx}
        onSelect={(si, qi) => { setSectionIdx(si); setQuestionIdx(qi); }} />

      {/* Quit confirm modal */}
      {confirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-zinc-900">Thoát bài test?</h3>
            <p className="text-sm text-zinc-600">Tiến trình sẽ không được lưu. Bạn chắc chắn muốn thoát?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmQuit(false)} className="flex-1 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                Tiếp tục làm bài
              </button>
              <button onClick={() => { clearInterval(timerRef.current!); onCancel(); }} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question grid — quick navigation overview
// ---------------------------------------------------------------------------

function QuestionGrid({ test, answers, sectionIdx, questionIdx, onSelect }: {
  test: LevelTestInfo;
  answers: Map<string, Answer>;
  sectionIdx: number;
  questionIdx: number;
  onSelect: (si: number, qi: number) => void;
}) {
  let flatCurrent = 0;
  for (let si = 0; si < sectionIdx; si++) flatCurrent += test.sections[si].questions.length;
  flatCurrent += questionIdx;

  let flat = 0;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
      <div className="text-xs font-medium text-zinc-500">Tổng quan câu hỏi</div>
      <div className="flex flex-wrap gap-1.5">
        {test.sections.map((sec, si) =>
          sec.questions.map((q, qi) => {
            const fi = flat++;
            const answered = answers.has(`${si}-${q.id}`);
            const isCurrent = fi === flatCurrent;
            return (
              <button
                key={`${si}-${qi}`}
                onClick={() => onSelect(si, qi)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-zinc-900 text-white"
                    : answered
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {fi + 1}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
