"use client";

import { useState } from "react";
import type { LearnConfig } from "@/lib/flashcard-utils";

interface Props {
  onStart: (config: LearnConfig) => void;
}

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"];

interface CountInputProps {
  label: string;
  icon: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

function CountInput({ label, icon, value, onChange, max = 50 }: CountInputProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold text-zinc-800">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function LearnPicker({ onStart }: Props) {
  const [level, setLevel] = useState("n5");
  const [vocabCount, setVocabCount]   = useState(10);
  const [kanjiCount, setKanjiCount]   = useState(5);
  const [grammarCount, setGrammarCount] = useState(3);

  const total = vocabCount + kanjiCount + grammarCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-800">Học ngẫu nhiên</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Hệ thống chọn ngẫu nhiên thẻ theo trình độ, sau đó kiểm tra để cập nhật trạng thái đã thuộc
        </p>
      </div>

      {/* Level picker */}
      <div>
        <p className="text-xs font-medium text-zinc-600 mb-2">Trình độ JLPT</p>
        <div className="flex gap-2">
          {JLPT_LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                level === lv
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {lv.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Count pickers */}
      <div>
        <p className="text-xs font-medium text-zinc-600 mb-2">Số lượng mỗi loại</p>
        <div className="space-y-2">
          <CountInput label="Từ vựng" icon="📝" value={vocabCount}   onChange={setVocabCount}   max={50} />
          <CountInput label="Kanji"   icon="漢" value={kanjiCount}   onChange={setKanjiCount}   max={30} />
          <CountInput label="Ngữ pháp" icon="📖" value={grammarCount} onChange={setGrammarCount} max={15} />
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 space-y-1">
        <p className="font-medium">Quy trình học:</p>
        <p>1. Xem qua {total} thẻ (nhấn để xem nội dung)</p>
        <p>2. Làm bài kiểm tra trắc nghiệm</p>
        <p>3. Đúng → Đã thuộc · Sai → Chưa thuộc (kể cả thẻ đã thuộc trước đó)</p>
      </div>

      <button
        onClick={() => onStart({ level, vocabCount, kanjiCount, grammarCount })}
        disabled={total === 0}
        className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Bắt đầu học ({total} thẻ)
      </button>
    </div>
  );
}
