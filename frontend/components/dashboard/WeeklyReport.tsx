"use client";

import React, { useState } from "react";

interface Props {
  report:      string | null;
  generatedAt: string | null;
  studiedDays: number; // days studied in last 7
}

/** Very lightweight inline markdown renderer (bold + headings + lists) */
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // Heading: ## or ###
    if (/^###\s/.test(line)) {
      return <h4 key={i} className="font-semibold text-zinc-800 mt-3 mb-1">{line.replace(/^###\s/, "")}</h4>;
    }
    if (/^##\s/.test(line)) {
      return <h3 key={i} className="font-bold text-zinc-900 mt-4 mb-1">{line.replace(/^##\s/, "")}</h3>;
    }
    // List item
    if (/^[-*]\s/.test(line)) {
      const content = parseBold(line.replace(/^[-*]\s/, ""));
      return <li key={i} className="ml-4 list-disc text-zinc-700">{content}</li>;
    }
    // Empty line → spacing
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    // Regular paragraph
    return <p key={i} className="text-zinc-700 leading-relaxed">{parseBold(line)}</p>;
  });
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-zinc-900">{p}</strong> : p
  );
}

export function WeeklyReport({ report, generatedAt, studiedDays }: Props) {
  const [expanded, setExpanded] = useState(false);

  const unlockDays = 3;
  const hasReport  = Boolean(report);
  const canUnlock  = studiedDays >= unlockDays;

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString("vi-VN", {
        weekday: "long", day: "numeric", month: "long",
      })
    : null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Báo cáo tuần
        </p>
        {formattedDate && (
          <p className="text-xs text-zinc-400">{formattedDate}</p>
        )}
      </div>

      {/* No report yet */}
      {!hasReport && (
        <div className="rounded-xl bg-zinc-50 border border-dashed border-zinc-300 px-4 py-6 text-center">
          {canUnlock ? (
            <p className="text-sm text-zinc-500">
              Báo cáo tuần sẽ được tạo vào Chủ nhật tuần này.
              <br />
              <span className="text-xs text-zinc-400 mt-1 block">
                Tiếp tục học đều đặn để nhận nhận xét cá nhân hoá.
              </span>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Học thêm{" "}
              <span className="font-semibold text-zinc-700">
                {unlockDays - studiedDays} ngày nữa
              </span>{" "}
              trong tuần này để mở khoá báo cáo AI.
            </p>
          )}
          <p className="text-2xl mt-3">📊</p>
        </div>
      )}

      {/* Has report */}
      {hasReport && report && (
        <>
          <div className={`text-sm overflow-hidden transition-all ${expanded ? "" : "max-h-32"}`}>
            <div className="space-y-0.5">{renderMarkdown(report)}</div>
          </div>

          {!expanded && (
            <div className="h-8 bg-gradient-to-t from-white to-transparent -mt-8 relative pointer-events-none" />
          )}

          <button
            onClick={() => setExpanded((s) => !s)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {expanded ? "Thu gọn ↑" : "Xem đầy đủ →"}
          </button>
        </>
      )}
    </div>
  );
}
