interface Props {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  className?: string;
}

/** Thin session-progress bar, shared by the flashcard, quiz and review screens. */
export function ProgressBar({ percent, className = "" }: Props) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className={`h-1.5 w-full rounded-full bg-zinc-100 ${className}`}>
      <div
        className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
