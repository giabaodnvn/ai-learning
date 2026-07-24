"use client";

import type { ReactNode } from "react";
import { JLPT_LEVELS as LEVELS, type JlptLevel as Level } from "@/types/quiz";
import { LEVEL_META } from "@/lib/levels";

interface Props {
  value: Level;
  onChange: (level: Level) => void;
  /**
   * "plain"  — neutral zinc pills (grammar / vocabulary grids).
   * "colored" — per-level colors + Japanese subtitle (kanji grid).
   */
  variant?: "plain" | "colored";
  /** Optional node rendered at the end of the tab row (e.g. a result count). */
  right?: ReactNode;
}

/** JLPT level pill tabs shared by the grammar, vocabulary and kanji grids. */
export function LevelTabs({ value, onChange, variant = "plain", right }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {LEVELS.map((l) => {
        const active = value === l;

        if (variant === "colored") {
          const m = LEVEL_META[l];
          return (
            <button
              key={l}
              onClick={() => onChange(l)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
                active ? m.activeClass : m.inactiveClass
              }`}
            >
              {m.label}
              <span className={`ml-1.5 text-xs font-normal ${active ? "opacity-80" : "opacity-60"}`}>
                {m.jp}
              </span>
            </button>
          );
        }

        return (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
      {right}
    </div>
  );
}
