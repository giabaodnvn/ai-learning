interface Props {
  /** Optional caption under the spinner. */
  message?: string;
  /** Accent colour of the spinning arc. */
  accent?: "zinc" | "indigo";
}

/** Card-shaped loading placeholder with a centred spinner. */
export function LoadingCard({ message, accent = "zinc" }: Props) {
  const arc = accent === "indigo" ? "border-t-indigo-600" : "border-t-zinc-800";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center gap-3">
      <div className={`h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 ${arc}`} />
      {message && <p className="text-xs text-zinc-400">{message}</p>}
    </div>
  );
}
