"use client";

import type { SubmitResult } from "./types";

interface Props {
  result: SubmitResult;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultScreen({ result, onRetry, onHome }: Props) {
  const pct = Math.round((result.score / result.total) * 100);
  const passed = result.passed;

  return (
    <div className="space-y-5">
      {/* Level up banner */}
      {result.level_up && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center space-y-1">
          <div className="text-2xl font-bold text-emerald-700">
            THĂNG CẤP!
          </div>
          <div className="text-sm text-emerald-600">
            {result.level_up.from.toUpperCase()} → {result.level_up.to.toUpperCase()}
          </div>
          <div className="text-xs text-emerald-500 mt-1">
            Trình độ của bạn đã được cập nhật tự động.
          </div>
        </div>
      )}

      {/* Score card */}
      <div className={`rounded-2xl border p-6 text-center space-y-3 ${
        passed
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      }`}>
        <div className={`text-5xl font-bold ${passed ? "text-emerald-600" : "text-red-600"}`}>
          {pct}%
        </div>
        <div className={`text-lg font-semibold ${passed ? "text-emerald-700" : "text-red-700"}`}>
          {passed ? "ĐẠT" : "CHƯA ĐẠT"}
        </div>
        <div className="text-sm text-zinc-600">
          {result.score} / {result.total} câu đúng &nbsp;·&nbsp; Ngưỡng đạt: {result.pass_score} câu
        </div>
      </div>

      {/* Per-section breakdown */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700">Kết quả theo phần</h3>
        {result.per_section.map((sec, i) => {
          const secPct = sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600">{sec.name}</span>
                <span className="font-semibold text-zinc-800">{sec.correct}/{sec.total}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full transition-all ${
                    secPct >= 70 ? "bg-emerald-500" : secPct >= 50 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${secPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Review wrong answers */}
      <ReviewSection result={result} />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Làm lại
        </button>
        <button
          onClick={onHome}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review section — show wrong / unanswered questions with explanations
// ---------------------------------------------------------------------------

function ReviewSection({ result }: { result: SubmitResult }) {
  const wrong: { sectionName: string; q: NonNullable<SubmitResult["sections"][0]["questions"][0]> }[] = [];

  result.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      const answered = q.your_answer_index !== undefined && q.your_answer_index !== null;
      const correct  = answered && q.your_answer_index === q.answer_index;
      if (!correct) wrong.push({ sectionName: sec.name_vi, q });
    });
  });

  if (wrong.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-sm text-emerald-700">
        Xuất sắc! Bạn trả lời đúng tất cả các câu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-700">
        Xem lại {wrong.length} câu sai / bỏ qua
      </h3>
      {wrong.map(({ sectionName, q }, i) => {
        const userIdx   = q.your_answer_index;
        const hasAnswer = userIdx !== undefined && userIdx !== null;
        return (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                {sectionName}
              </span>
              <p className="text-sm text-zinc-800 leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isCorrect  = oi === q.answer_index;
                const isSelected = oi === userIdx;
                return (
                  <div
                    key={oi}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      isCorrect
                        ? "bg-emerald-100 text-emerald-800 font-semibold"
                        : isSelected
                        ? "bg-red-100 text-red-700 line-through"
                        : "bg-zinc-50 text-zinc-600"
                    }`}
                  >
                    <span className="font-semibold mr-1.5">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                    {isCorrect && <span className="ml-2 text-emerald-600">✓</span>}
                    {isSelected && !isCorrect && <span className="ml-2 text-red-500">✗</span>}
                  </div>
                );
              })}
            </div>

            {!hasAnswer && (
              <p className="text-xs text-zinc-400 italic">Bạn không trả lời câu này</p>
            )}

            {q.explanation_vi && (
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs text-zinc-600 leading-relaxed">
                <span className="font-semibold text-zinc-700">Giải thích: </span>
                {q.explanation_vi}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
