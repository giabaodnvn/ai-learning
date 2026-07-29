const BAR_WIDTHS = ["w-3/4", "w-1/3", "w-full", "w-2/3"];

interface Props {
  /** Number of placeholder cards. */
  count?: number;
  /** Number of shimmer bars inside each card (max 4). */
  lines?: number;
}

/** Loading placeholder for the two-column card lists (reading / listening). */
export function CardSkeletonGrid({ count = 4, lines = 3 }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2">
          {BAR_WIDTHS.slice(0, lines).map((w) => (
            <div key={w} className={`h-3 animate-pulse rounded bg-zinc-100 ${w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
