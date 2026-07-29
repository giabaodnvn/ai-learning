interface Props {
  score: number;
  total: number;
}

/** Score headline (emoji, ratio, percentage bar) shared by every quiz result view. */
export function ScoreCard({ score, total }: Props) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji =
    percent === 100 ? "🏆" : percent >= 75 ? "🎉" : percent >= 50 ? "😊" : "📚";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-2">
      <div className="text-4xl">{emoji}</div>
      <p className="text-3xl font-bold text-zinc-900">
        {score} <span className="text-zinc-400 font-normal text-xl">/ {total}</span>
      </p>
      <p className="text-sm text-zinc-500">{percent}% câu trả lời đúng</p>
      <div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent >= 75 ? "bg-green-400" : percent >= 50 ? "bg-yellow-400" : "bg-red-400"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
