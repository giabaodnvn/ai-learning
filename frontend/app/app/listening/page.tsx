"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGeneratedContent } from "@/hooks/useGeneratedContent";
import { ExerciseCard, type ExerciseData } from "@/components/listening/ExerciseCard";
import { PlayerView } from "@/components/listening/PlayerView";
import { ListeningQuiz } from "@/components/listening/ListeningQuiz";
import { ListeningResult } from "@/components/listening/ListeningResult";
import { StageView } from "@/components/shared/StageView";
import { CardSkeletonGrid } from "@/components/shared/CardSkeletonGrid";
import { GenerateForm, type TopicOption } from "@/components/shared/GenerateForm";
import { LevelTabs } from "@/components/shared/LevelTabs";
import type { AnswerResult } from "@/types/quiz";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { EmptyState } from "@/components/shared/EmptyState";

type View = "list" | "player" | "quiz" | "result";

const TOPICS: TopicOption[] = [
  { label: "Thông báo ga tàu", value: "駅でのアナウンス" },
  { label: "Hội thoại quán cà phê", value: "カフェでの会話" },
  { label: "Hội thoại điện thoại", value: "電話での会話" },
  { label: "Giải thích bài học", value: "授業の説明" },
  { label: "Tin tức", value: "ニュース" },
  { label: "Sinh hoạt hằng ngày", value: "日常会話" },
  { label: "Mua sắm", value: "買い物" },
  { label: "Du lịch", value: "旅行" },
];

export default function ListeningPage() {
  const { user } = useCurrentUser();

  const [view,        setView]        = useState<View>("list");
  const [selected,    setSelected]    = useState<ExerciseData | null>(null);
  const [quizResults, setQuizResults] = useState<AnswerResult[]>([]);
  const [speechRate,  setSpeechRate]  = useState(1.0);
  const [quizScore,   setQuizScore]   = useState(0);
  const [quizTotal,   setQuizTotal]   = useState(0);
  const [jlptLevel,   setJlptLevel]   = useState("");

  const effectiveLevel = jlptLevel || user?.jlpt_level || "n5";

  const exercises = useGeneratedContent<ExerciseData>({
    resource: "listeningExercises",
    path: "/api/v1/listening_exercises",
    level: effectiveLevel,
    listEnabled: view === "list",
    onGenerated: (exercise) => {
      setSelected(exercise);
      setView("player");
    },
    listErrorMessage: "Không thể tải danh sách bài luyện nghe.",
    generateErrorMessage: "Không thể tạo bài luyện nghe. Vui lòng thử lại.",
  });

  function openExercise(exercise: ExerciseData) {
    setSelected(exercise);
    setQuizResults([]);
    setView("player");
  }

  function startQuiz(rate: number) {
    setSpeechRate(rate);
    setView("quiz");
  }

  function finishQuiz(results: AnswerResult[], score: number, total: number) {
    setQuizResults(results);
    setQuizScore(score);
    setQuizTotal(total);
    setView("result");
  }

  function goToList() {
    setSelected(null);
    setView("list");
  }

  // --- Result screen ---
  if (view === "result" && selected) {
    return (
      <StageView
        backLabel="Danh sách bài luyện nghe"
        onBack={goToList}
        errorMessage="Không thể hiển thị kết quả. Vui lòng thử lại."
      >
        <ListeningResult
          exercise={selected}
          results={quizResults}
          score={quizScore}
          total={quizTotal}
          onListenAgain={() => setView("player")}
          onNewExercise={goToList}
        />
      </StageView>
    );
  }

  // --- Quiz screen ---
  if (view === "quiz" && selected) {
    return (
      <StageView
        backLabel="Quay lại nghe"
        onBack={() => setView("player")}
        errorMessage="Không thể tải câu hỏi. Vui lòng thử lại."
      >
        <ListeningQuiz
          exercise={selected}
          speechRate={speechRate}
          onFinish={finishQuiz}
        />
      </StageView>
    );
  }

  // --- Player screen ---
  if (view === "player" && selected) {
    return (
      <StageView
        backLabel="Danh sách bài luyện nghe"
        onBack={goToList}
        errorMessage="Không thể tải bài luyện nghe. Vui lòng thử lại."
      >
        <PlayerView exercise={selected} onStartQuiz={startQuiz} />
      </StageView>
    );
  }

  // --- List screen ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Nghe hiểu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện nghe tiếng Nhật qua các bài hội thoại, kiểm tra hiểu nội dung.
        </p>
      </div>

      <GenerateForm
        title="Tạo bài luyện nghe mới"
        topics={TOPICS}
        customPlaceholder="e.g. 仕事の会議、医者との会話..."
        level={jlptLevel}
        onLevelChange={setJlptLevel}
        accountLevel={user?.jlpt_level}
        submitting={exercises.generating}
        submitLabel="Tạo bài luyện nghe"
        submittingLabel="Đang tạo bài luyện nghe…"
        error={exercises.generateError}
        onSubmit={exercises.generate}
      />

      <LevelTabs
        value={effectiveLevel}
        size="sm"
        label="Lọc theo trình độ:"
        onChange={(l) => setJlptLevel(l === effectiveLevel && jlptLevel ? "" : l)}
      />

      {exercises.listError && (
        <ErrorBanner>
          {exercises.listError}
        </ErrorBanner>
      )}

      {exercises.loading ? (
        <CardSkeletonGrid />
      ) : exercises.items.length === 0 ? (
        <EmptyState
          title={`Chưa có bài luyện nghe nào cho trình độ ${effectiveLevel.toUpperCase()}.`}
          subtitle="Hãy tạo bài luyện nghe mới ở trên!"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercises.items.map((e) => (
            <ExerciseCard key={e.id} exercise={e} onClick={openExercise} />
          ))}
        </div>
      )}
    </div>
  );
}
