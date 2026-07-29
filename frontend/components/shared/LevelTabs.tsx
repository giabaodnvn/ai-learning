"use client";

import type { ReactNode } from "react";
import { JLPT_LEVELS as LEVELS, type JlptLevel as Level } from "@/types/quiz";
import { LEVEL_META } from "@/lib/levels";

/**
 * "md" — full-size tabs above the grammar / vocabulary / kanji grids.
 * "sm" — compact filter pills above the reading / listening lists.
 */
const SIZE_CLASSES = {
  md: {
    base: "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
    inactive: "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50",
  },
  sm: {
    base: "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
    inactive: "border border-zinc-300 text-zinc-600 hover:bg-zinc-50",
  },
} as const;

interface Props {
  /** Active level. Typed as a plain string so callers can pass a resolved fallback. */
  value: string;
  onChange: (level: Level) => void;
  /**
   * "plain"  — neutral zinc pills (grammar / vocabulary grids, list filters).
   * "colored" — per-level colors + Japanese subtitle (kanji grid).
   */
  variant?: "plain" | "colored";
  size?: keyof typeof SIZE_CLASSES;
  /** Optional caption rendered before the pills. */
  label?: string;
  /** Optional node rendered at the end of the tab row (e.g. a result count). */
  right?: ReactNode;
}

/** JLPT level pills — the level selector shared by every list screen. */
export function LevelTabs({ value, onChange, variant = "plain", size = "md", label, right }: Props) {
  const sizing = SIZE_CLASSES[size];

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {label && <span className="text-xs text-zinc-500">{label}</span>}

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
            className={`${sizing.base} ${active ? "bg-zinc-900 text-white" : sizing.inactive}`}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
      {right}
    </div>
  );
}
