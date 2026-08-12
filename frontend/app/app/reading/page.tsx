"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGeneratedContent } from "@/hooks/useGeneratedContent";
import { PassageCard, PassageData } from "@/components/reading/PassageCard";
import { ReaderView } from "@/components/reading/ReaderView";
import { QuizSection } from "@/components/reading/QuizSection";
import { ResultScreen } from "@/components/reading/ResultScreen";
import { StageView } from "@/components/shared/StageView";
import { ContentCardGrid } from "@/components/shared/ContentCardGrid";
import { GenerateForm, type TopicOption } from "@/components/shared/GenerateForm";
import { LevelTabs } from "@/components/shared/LevelTabs";
import { PageHeader } from "@/components/shared/PageHeader";
import type { AnswerResult } from "@/types/quiz";

type View = "list" | "reading" | "quiz" | "result";

const TOPICS: TopicOption[] = [
  { label: "Sinh hoạt hằng ngày",  value: "日常生活" },
  { label: "Thực phẩm & ẩm thực",  value: "食べ物と料理" },
  { label: "Du lịch",              value: "旅行" },
  { label: "Mua sắm",              value: "買い物" },
  { label: "Sức khỏe",             value: "健康" },
  { label: "Thiên nhiên & thời tiết", value: "自然と天気" },
  { label: "Văn hóa Nhật Bản",     value: "日本文化" },
  { label: "Công việc",            value: "仕事" },
];

export default function ReadingPage() {
  const { user } = useCurrentUser();

  const [view,        setView]        = useState<View>("list");
  const [selected,    setSelected]    = useState<PassageData | null>(null);
  const [quizResults, setQuizResults] = useState<AnswerResult[]>([]);
  const [jlptLevel,   setJlptLevel]   = useState("");

  const effectiveLevel = jlptLevel || user?.jlpt_level || "n5";

  const passages = useGeneratedContent<PassageData>({
    resource: "readingPassages",
    path: "/api/v1/reading_passages",
    level: effectiveLevel,
    listEnabled: view === "list",
    onGenerated: (passage) => {
      setSelected(passage);
      setView("reading");
    },
    listErrorMessage: "Không thể tải danh sách bài đọc.",
    generateErrorMessage: "Không thể tạo bài đọc. Vui lòng thử lại.",
  });

  function openPassage(passage: PassageData) {
    setSelected(passage);
    setQuizResults([]);
    setView("reading");
  }

  function finishQuiz(results: AnswerResult[]) {
    setQuizResults(results);
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
        backLabel="Danh sách bài đọc"
        onBack={goToList}
        errorMessage="Không thể hiển thị kết quả. Vui lòng thử lại."
      >
        <ResultScreen
          passage={selected}
          results={quizResults}
          onReadAgain={() => setView("reading")}
          onNewPassage={goToList}
        />
      </StageView>
    );
  }

  // --- Quiz screen ---
  if (view === "quiz" && selected) {
    return (
      <StageView
        backLabel="Quay lại bài đọc"
        onBack={() => setView("reading")}
        errorMessage="Không thể tải câu hỏi. Vui lòng thử lại."
      >
        <QuizSection passage={selected} onFinish={finishQuiz} />
      </StageView>
    );
  }

  // --- Reader screen ---
  if (view === "reading" && selected) {
    return (
      <StageView
        backLabel="Danh sách bài đọc"
        onBack={goToList}
        errorMessage="Không thể tải bài đọc. Vui lòng thử lại."
      >
        <ReaderView passage={selected} onStartQuiz={() => setView("quiz")} />
      </StageView>
    );
  }

  // --- List screen ---
  return (
    <div className="space-y-6">
      <PageHeader
        title="Đọc hiểu"
        description="Luyện đọc tiếng Nhật kèm TTS, tra từ nhanh và kiểm tra hiểu bài."
      />

      <GenerateForm
        title="Tạo bài đọc mới"
        topics={TOPICS}
        customPlaceholder="e.g. 桜の季節、通勤電車..."
        level={jlptLevel}
        onLevelChange={setJlptLevel}
        accountLevel={user?.jlpt_level}
        submitting={passages.generating}
        submitLabel="Tạo bài đọc"
        submittingLabel="Đang tạo bài đọc…"
        error={passages.generateError}
        onSubmit={passages.generate}
      />

      <LevelTabs
        value={effectiveLevel}
        size="sm"
        label="Lọc theo trình độ:"
        onChange={(l) => setJlptLevel(l === effectiveLevel && jlptLevel ? "" : l)}
      />

      <ContentCardGrid
        items={passages.items}
        loading={passages.loading}
        error={passages.listError}
        skeletonLines={4}
        emptyTitle={`Chưa có bài đọc nào cho trình độ ${effectiveLevel.toUpperCase()}.`}
        emptySubtitle="Hãy tạo bài đọc mới ở trên!"
        renderItem={(p) => <PassageCard key={p.id} passage={p} onClick={openPassage} />}
      />
    </div>
  );
}
