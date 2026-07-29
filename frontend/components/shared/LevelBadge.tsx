import { LEVEL_META } from "@/lib/levels";
import type { JlptLevel } from "@/types/quiz";

interface Props {
  level: string;
  className?: string;
}

/**
 * Small colour-coded JLPT pill ("N5"). The palette lives in lib/levels.ts —
 * the reading list and the flashcard front each used to carry their own map,
 * and the two disagreed on n5 (green vs emerald).
 */
export function LevelBadge({ level, className = "" }: Props) {
  const meta = LEVEL_META[level as JlptLevel];

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        meta?.badgeClass ?? "bg-zinc-100 text-zinc-600"
      } ${className}`}
    >
      {level.toUpperCase()}
    </span>
  );
}
