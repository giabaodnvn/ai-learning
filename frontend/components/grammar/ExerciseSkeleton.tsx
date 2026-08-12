/** Shimmer stand-in for a multiple-choice exercise while the AI generates it. */
export function ExerciseSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="h-6 animate-pulse rounded bg-zinc-100 w-3/4" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
