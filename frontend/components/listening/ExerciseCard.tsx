export interface ExerciseData {
  id: number;
  title: string;
  script_ja: string;
  script_vi: string;
  jlpt_level: string;
  topic: string;
  questions: Array<{ question_ja: string; options: string[]; correct_index: number }>;
  ai_generated: boolean;
  created_at: string;
}

interface Props {
  exercise: ExerciseData;
  onClick: (exercise: ExerciseData) => void;
}

export function ExerciseCard({ exercise, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(exercise)}
      className="rounded-2xl border border-zinc-200 bg-white p-5 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 text-sm flex-1">
          {exercise.title}
        </h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 uppercase shrink-0">
          {exercise.jlpt_level}
        </span>
      </div>

      <p className="text-xs text-zinc-500">
        {exercise.topic}
      </p>

      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <span>🎧</span>
        <span>{exercise.questions.length} câu hỏi</span>
      </div>
    </button>
  );
}
