"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ScoreCard } from "@/components/shared/ScoreCard";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { QuestionSteps } from "@/components/shared/QuestionSteps";
import { ExerciseOptions } from "./ExerciseOptions";

interface Exercise {
  type: "fill_blank" | "choice" | "translate";
  sentence_with_blank?: string;
  question_vi?: string;
  prompt_vi?: string;
  options?: string[];
  correct_answer?: string;
  answer_index?: number;
  explanation_vi: string;
}

interface QuizState {
  selectedIndex: number | null;
  result: { correct: boolean; explanation_vi: string } | null;
}

interface Props {
  grammarPointId: number;
  pattern: string;
}

/** True when the exercise carries every field its renderer dereferences. */
function isRenderable(ex: Exercise): boolean {
  const hasOptions =
    Array.isArray(ex.options) && ex.options.length > 0 && typeof ex.answer_index === "number";

  switch (ex.type) {
    case "fill_blank": return hasOptions && !!ex.sentence_with_blank;
    case "choice":     return hasOptions && !!ex.question_vi;
    case "translate":  return !!ex.prompt_vi;
    default:           return false;
  }
}

export function GrammarPracticeSet({ grammarPointId, pattern }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStates, setQuizStates] = useState<QuizState[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [translateInput, setTranslateInput] = useState("");

  const isLoading = loading || fetching || exercises.length === 0;
  const currentExercise = exercises[currentIndex];
  const currentState = quizStates[currentIndex];
  const isLast = currentIndex === exercises.length - 1;
  const correctCount = allResults.filter((r) => r).length;

  async function loadExerciseSet() {
    setFetching(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/grammar_points/${grammarPointId}/generate_set`);
      // The set is LLM output: drop anything missing the fields its renderer
      // dereferences, rather than crashing mid-quiz on `options.map`.
      const usable = (res.data.exercises as Exercise[]).filter(isRenderable);
      if (usable.length === 0) throw new Error("empty set");

      setExercises(usable);
      setQuizStates(usable.map(() => ({ selectedIndex: null, result: null })));
      setAllResults([]);
      setCurrentIndex(0);
      setShowResult(false);
    } catch {
      setError("Không thể tạo bộ luyện tập. Vui lòng thử lại.");
    } finally {
      setFetching(false);
    }
  }

  function handleAnswerMCQ(optionIndex: number) {
    if (currentState.selectedIndex !== null) return;

    const correct = optionIndex === currentExercise.answer_index;
    const result = { correct, explanation_vi: currentExercise.explanation_vi };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, selectedIndex: optionIndex, result } : s))
    );
    setAllResults((prev) => {
      const next = [...prev];
      next[currentIndex] = correct;
      return next;
    });
  }

  // Translations aren't graded automatically: recording a result switches the
  // view to "correct answer + your answer", and the user then self-marks (which
  // is what writes the real outcome into allResults).
  function handleTranslateSubmit() {
    if (!translateInput.trim()) return;

    const result = { correct: false, explanation_vi: currentExercise.explanation_vi };
    setQuizStates((prev) => prev.map((s, i) => (i === currentIndex ? { ...s, result } : s)));
  }

  function handleMarkTranslateCorrect() {
    const next = [...allResults];
    next[currentIndex] = true;
    setAllResults(next);
    proceedToNext(next);
  }

  function handleMarkTranslateWrong() {
    const next = [...allResults];
    next[currentIndex] = false;
    setAllResults(next);
    proceedToNext(next);
  }

  function proceedToNext(results: boolean[]) {
    if (isLast) {
      submitSet(results);
    } else {
      setCurrentIndex((i) => i + 1);
      setTranslateInput("");
    }
  }

  async function submitSet(results: boolean[]) {
    setLoading(true);
    setError(null);
    try {
      const score = results.filter((r) => r).length;
      await api.post(`/api/v1/grammar_points/${grammarPointId}/complete_set`, {
        score,
        total: exercises.length,
      });
      setShowResult(true);
    } catch {
      setError("Không thể gửi kết quả. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // Idle state: show start button
  if (exercises.length === 0 && !fetching) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-zinc-500">Bộ luyện tập 10 câu hỏi về &quot;{pattern}&quot;</p>
        <button
          onClick={loadExerciseSet}
          disabled={fetching}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Bắt đầu bộ luyện tập
        </button>
        {error && <ErrorBanner compact>{error}</ErrorBanner>}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
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

  // Result screen
  if (showResult) {
    return (
      <div className="space-y-5">
        <ScoreCard score={correctCount} total={exercises.length} />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setExercises([]);
              setCurrentIndex(0);
              setShowResult(false);
              setAllResults([]);
              setTranslateInput("");
            }}
            className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Bộ mới
          </button>
        </div>
      </div>
    );
  }

  if (!currentExercise || !currentState) return null;

  return (
    <div className="space-y-4">
      <QuestionSteps current={currentIndex} total={exercises.length} />

      {/* Exercise content */}
      {currentExercise.type === "fill_blank" && (
        <div className="space-y-4">
          {/* Sentence */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-lg text-zinc-800 leading-relaxed">
              {renderSentence(currentExercise.sentence_with_blank ?? "")}
            </p>
          </div>

          {/* Options */}
          <ExerciseOptions
            options={currentExercise.options ?? []}
            answerIndex={currentExercise.answer_index}
            selectedIndex={currentState.selectedIndex}
            answered={currentState.result !== null}
            onSelect={handleAnswerMCQ}
            layout="grid"
          />
        </div>
      )}

      {currentExercise.type === "choice" && (
        <div className="space-y-4">
          {/* Question */}
          <p className="text-sm font-medium text-zinc-800 leading-relaxed">
            {currentExercise.question_vi}
          </p>

          {/* Options */}
          <ExerciseOptions
            options={currentExercise.options ?? []}
            answerIndex={currentExercise.answer_index}
            selectedIndex={currentState.selectedIndex}
            answered={currentState.result !== null}
            onSelect={handleAnswerMCQ}
            layout="list"
          />
        </div>
      )}

      {currentExercise.type === "translate" && (
        <div className="space-y-4">
          {/* Prompt */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-600 mb-2">Dịch sang tiếng Nhật:</p>
            <p className="text-base text-blue-900">{currentExercise.prompt_vi}</p>
          </div>

          {/* Input */}
          {!currentState.result ? (
            <>
              <input
                type="text"
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                placeholder="Nhập bản dịch tiếng Nhật..."
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-zinc-500"
              />
              <button
                onClick={handleTranslateSubmit}
                disabled={!translateInput.trim()}
                className="w-full rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Xem đáp án
              </button>
            </>
          ) : (
            <>
              {/* Show correct answer */}
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-600 mb-2">Đáp án:</p>
                <p className="text-base text-green-900 font-medium">{currentExercise.correct_answer}</p>
              </div>

              {/* User's answer */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-600 mb-2">Bạn gõ:</p>
                <p className="text-base text-zinc-800">{translateInput}</p>
              </div>

              {/* Self-mark buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleMarkTranslateCorrect}
                  className="flex-1 rounded-lg bg-green-500 text-white px-4 py-2 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  ✓ Tôi làm đúng
                </button>
                <button
                  onClick={handleMarkTranslateWrong}
                  className="flex-1 rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  ✗ Tôi làm sai
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback after MCQ answer */}
      {currentState.result && currentExercise.type !== "translate" && (
        <div
          className={`rounded-xl border p-4 text-sm leading-relaxed ${
            currentState.result.correct
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="font-semibold mb-1">
            {currentState.result.correct ? "Chính xác! 🎉" : "Không chính xác"}
          </p>
          <p>{currentState.result.explanation_vi}</p>
        </div>
      )}

      {/* Feedback for translate after marking */}
      {currentState.result && currentExercise.type === "translate" && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p className="font-semibold mb-2">Giải thích:</p>
          <p>{currentExercise.explanation_vi}</p>
        </div>
      )}

      {/* Next button (for MCQ) or marked for translate */}
      {currentState.result && currentExercise.type !== "translate" && (
        <button
          onClick={() => {
            if (isLast) {
              submitSet(allResults);
            } else {
              setCurrentIndex((i) => i + 1);
            }
          }}
          disabled={loading}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isLast ? "Xem kết quả →" : "Câu tiếp theo →"}
        </button>
      )}

      {error && <ErrorBanner compact>{error}</ErrorBanner>}
    </div>
  );
}

function renderSentence(sentence: string) {
  const parts = sentence.split("___");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="inline-block min-w-[60px] border-b-2 border-zinc-400 mx-1 align-bottom" />
      )}
    </span>
  ));
}
