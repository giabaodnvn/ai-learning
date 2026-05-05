"use client";

import { useState } from "react";
import { api } from "@/lib/api";

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
  loading: boolean;
}

interface Props {
  grammarPointId: number;
  pattern: string;
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
      setExercises(res.data.exercises);
      setQuizStates(res.data.exercises.map(() => ({ selectedIndex: null, result: null, loading: false })));
      setAllResults([]);
      setCurrentIndex(0);
      setShowResult(false);
    } catch {
      setError("Không thể tạo bộ luyện tập. Vui lòng thử lại.");
    } finally {
      setFetching(false);
    }
  }

  async function handleAnswerFillBlank(optionIndex: number) {
    if (currentState.selectedIndex !== null || currentState.loading) return;

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, selectedIndex: optionIndex, loading: true } : s))
    );

    const correct = optionIndex === currentExercise.answer_index;
    const result = {
      correct,
      explanation_vi: currentExercise.explanation_vi,
    };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, result, loading: false } : s))
    );
    setAllResults((prev) => {
      const next = [...prev];
      next[currentIndex] = correct;
      return next;
    });
  }

  async function handleAnswerChoice(optionIndex: number) {
    if (currentState.selectedIndex !== null || currentState.loading) return;

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, selectedIndex: optionIndex, loading: true } : s))
    );

    const correct = optionIndex === currentExercise.answer_index;
    const result = {
      correct,
      explanation_vi: currentExercise.explanation_vi,
    };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, result, loading: false } : s))
    );
    setAllResults((prev) => {
      const next = [...prev];
      next[currentIndex] = correct;
      return next;
    });
  }

  async function handleTranslateSubmit() {
    if (!translateInput.trim() || currentState.loading) return;

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, loading: true } : s))
    );

    // For translation, user self-marks as correct/incorrect (show correct answer)
    const result = {
      correct: false, // User will visually compare with correct_answer
      explanation_vi: currentExercise.explanation_vi,
    };

    setQuizStates((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, result, loading: false } : s))
    );

    // User marks it manually in the UI
    // For now, we'll show the correct answer and let them self-assess
  }

  function handleMarkTranslateCorrect() {
    setAllResults((prev) => {
      const next = [...prev];
      next[currentIndex] = true;
      return next;
    });
    proceedToNext();
  }

  function handleMarkTranslateWrong() {
    setAllResults((prev) => {
      const next = [...prev];
      next[currentIndex] = false;
      return next;
    });
    proceedToNext();
  }

  async function proceedToNext() {
    if (isLast) {
      // Submit the set
      submitSet();
    } else {
      setCurrentIndex((i) => i + 1);
      setTranslateInput("");
    }
  }

  async function submitSet() {
    setLoading(true);
    setError(null);
    try {
      const score = correctCount;
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
        <p className="text-sm text-zinc-500">Bộ luyện tập 10 câu hỏi về "{pattern}"</p>
        <button
          onClick={loadExerciseSet}
          disabled={fetching}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Bắt đầu bộ luyện tập
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
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
    const percent = Math.round((correctCount / exercises.length) * 100);
    const emoji =
      percent === 100 ? "🏆" : percent >= 75 ? "🎉" : percent >= 50 ? "😊" : "📚";

    return (
      <div className="space-y-5">
        {/* Score card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-2">
          <div className="text-4xl">{emoji}</div>
          <p className="text-3xl font-bold text-zinc-900">
            {correctCount} <span className="text-zinc-400 font-normal text-xl">/ {exercises.length}</span>
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
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Câu {currentIndex + 1} / {exercises.length}</span>
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < currentIndex
                  ? "bg-green-400"
                  : i === currentIndex
                  ? "bg-zinc-900"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise content */}
      {currentExercise.type === "fill_blank" && (
        <div className="space-y-4">
          {/* Sentence */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-lg text-zinc-800 leading-relaxed">
              {renderSentence(currentExercise.sentence_with_blank!)}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2">
            {currentExercise.options!.map((opt, idx) => {
              const isCorrect = idx === currentExercise.answer_index;
              const isSelected = idx === currentState.selectedIndex;
              const answered = currentState.result !== null;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerFillBlank(idx)}
                  disabled={answered}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${
                    answered && isCorrect
                      ? "border-green-400 bg-green-50 text-green-800"
                      : answered && isSelected
                      ? "border-red-400 bg-red-50 text-red-800"
                      : answered
                      ? "border-zinc-200 bg-white text-zinc-400"
                      : "border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 cursor-pointer"
                  }`}
                >
                  <span className="mr-2 text-xs text-zinc-400">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                  {answered && isCorrect && " ✓"}
                  {answered && isSelected && !isCorrect && " ✗"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentExercise.type === "choice" && (
        <div className="space-y-4">
          {/* Question */}
          <p className="text-sm font-medium text-zinc-800 leading-relaxed">
            {currentExercise.question_vi}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {currentExercise.options!.map((opt, idx) => {
              const isCorrect = idx === currentExercise.answer_index;
              const isSelected = idx === currentState.selectedIndex;
              const answered = currentState.result !== null;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerChoice(idx)}
                  disabled={answered}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                    answered && isCorrect
                      ? "border-green-400 bg-green-50 text-green-800"
                      : answered && isSelected
                      ? "border-red-400 bg-red-50 text-red-800"
                      : answered
                      ? "border-zinc-200 bg-white text-zinc-400"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer"
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                  {answered && isCorrect && " ✓"}
                  {answered && isSelected && !isCorrect && " ✗"}
                </button>
              );
            })}
          </div>
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
                disabled={!translateInput.trim() || currentState.loading}
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
              submitSet();
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

      {error && <p className="text-sm text-red-600">{error}</p>}
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
