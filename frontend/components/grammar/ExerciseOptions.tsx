"use client";

interface Props {
  options: string[];
  answerIndex?: number;
  selectedIndex: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
  /** "grid" for the two-column fill-in-the-blank choices, "list" for full-width rows. */
  layout: "grid" | "list";
}

/**
 * Answer buttons for a multiple-choice grammar exercise, with the
 * correct/incorrect colouring applied once the question has been answered.
 * The fill_blank and choice exercises render the same buttons in a different
 * arrangement — this was two near-identical 28-line blocks.
 */
export function ExerciseOptions({
  options,
  answerIndex,
  selectedIndex,
  answered,
  onSelect,
  layout,
}: Props) {
  const container = layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2";
  const shape =
    layout === "grid"
      ? "rounded-lg px-4 py-3 text-sm font-medium text-left"
      : "w-full text-left rounded-xl px-4 py-3 text-sm";

  return (
    <div className={container}>
      {options.map((opt, idx) => {
        const isCorrect  = idx === answerIndex;
        const isSelected = idx === selectedIndex;

        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            disabled={answered}
            className={`border transition-colors ${shape} ${stateClass(answered, isCorrect, isSelected)}`}
          >
            <span className="mr-2 text-xs text-zinc-400">{String.fromCharCode(65 + idx)}.</span>
            {opt}
            {answered && isCorrect && " ✓"}
            {answered && isSelected && !isCorrect && " ✗"}
          </button>
        );
      })}
    </div>
  );
}

function stateClass(answered: boolean, isCorrect: boolean, isSelected: boolean): string {
  if (!answered) return "border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 cursor-pointer";
  if (isCorrect) return "border-green-400 bg-green-50 text-green-800";
  if (isSelected) return "border-red-400 bg-red-50 text-red-800";
  return "border-zinc-200 bg-white text-zinc-400";
}
