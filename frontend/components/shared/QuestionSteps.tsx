/** One pill per question: green behind you, dark on the current one, grey ahead. */
interface Props {
  current: number;
  total: number;
}

/**
 * "Câu 3 / 10" plus the step pills, shown above every multi-question exercise.
 * The reading/listening quiz player and the grammar practice set each had a
 * byte-identical copy of this markup.
 */
export function QuestionSteps({ current, total }: Props) {
  return (
    <div className="flex items-center justify-between text-xs text-zinc-400">
      <span>Câu {current + 1} / {total}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i < current ? "bg-green-400" : i === current ? "bg-zinc-900" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
