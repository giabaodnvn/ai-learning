"use client";

interface Props {
  /** Grades submitted this session, on the review screen's 0/3/4/5 scale. */
  qualities: number[];
  /** True when the queue was empty to begin with, rather than worked through. */
  nothingDue: boolean;
  /** Cards still due server-side, including the ones just reviewed. */
  totalDue: number;
  onRestart: () => void;
}

/** End-of-session panel: either "nothing due today" or the session's score. */
export function ReviewSummary({ qualities, nothingDue, totalDue, onRestart }: Props) {
  const total = qualities.length;
  const correct = qualities.filter((q) => q >= 3).length;
  const remaining = totalDue - total;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center space-y-4">
      <p className="text-4xl">
        {nothingDue ? "🎉" : total > 0 && correct / total >= 0.8 ? "🏆" : "💪"}
      </p>

      {nothingDue ? (
        <>
          <p className="text-lg font-bold text-zinc-900">Không có thẻ nào cần ôn hôm nay!</p>
          <p className="text-sm text-zinc-500">Quay lại sau nhé.</p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-zinc-900">Hoàn thành phiên ôn tập!</p>
          <p className="text-sm text-zinc-500">
            Đúng {correct}/{total} thẻ ({total > 0 ? Math.round((correct / total) * 100) : 0}%)
          </p>
          {remaining > 0 && (
            <p className="text-sm text-amber-600 font-medium">
              Còn {remaining} thẻ đến hạn — nhấn &quot;Tiếp tục&quot; để ôn thêm.
            </p>
          )}
        </>
      )}

      <button
        onClick={onRestart}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        {remaining > 0 ? "Tiếp tục ôn tập" : "Tải lại"}
      </button>
    </div>
  );
}
