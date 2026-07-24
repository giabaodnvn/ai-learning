// Single source of truth for JLPT level metadata. Previously the Vietnamese
// labels, the Japanese names (初級…上級) and the per-level pill colors were
// copy-pasted — with drifting wording — across the profile page, the dashboard,
// the level-test lobby and the kanji grid.

import { JLPT_LEVELS, type JlptLevel } from "@/types/quiz";

export interface LevelMeta {
  value: JlptLevel;
  /** Short pill label, e.g. "N5". */
  label: string;
  /** Full Vietnamese label, e.g. "N5 – Sơ cấp". */
  labelVi: string;
  /** Japanese level name, e.g. "初級". */
  jp: string;
  /** Tailwind classes for the colored active pill. */
  activeClass: string;
  /** Tailwind classes for the colored inactive pill. */
  inactiveClass: string;
}

export const LEVEL_META: Record<JlptLevel, LevelMeta> = {
  n5: { value: "n5", label: "N5", labelVi: "N5 – Sơ cấp",   jp: "初級",   activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200", inactiveClass: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
  n4: { value: "n4", label: "N4", labelVi: "N4 – Sơ trung", jp: "初中級", activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200",         inactiveClass: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  n3: { value: "n3", label: "N3", labelVi: "N3 – Trung cấp", jp: "中級",  activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200",      inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50" },
  n2: { value: "n2", label: "N2", labelVi: "N2 – Trung cao", jp: "中上級", activeClass: "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200",   inactiveClass: "border-violet-200 text-violet-700 hover:bg-violet-50" },
  n1: { value: "n1", label: "N1", labelVi: "N1 – Cao cấp",  jp: "上級",   activeClass: "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200",         inactiveClass: "border-rose-200 text-rose-700 hover:bg-rose-50" },
};

/** Ordered n5 → n1 list, derived from LEVEL_META. */
export const LEVELS_META: LevelMeta[] = JLPT_LEVELS.map((l) => LEVEL_META[l]);

/** value → full Vietnamese label lookup. */
export const LEVEL_LABEL_VI: Record<string, string> =
  Object.fromEntries(LEVELS_META.map((m) => [m.value, m.labelVi]));

/** value → Japanese level name lookup. */
export const LEVEL_JP: Record<string, string> =
  Object.fromEntries(LEVELS_META.map((m) => [m.value, m.jp]));
