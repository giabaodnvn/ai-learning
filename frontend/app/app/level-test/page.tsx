"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LevelTestLobby } from "@/components/level-test/LevelTestLobby";
import { TestRunner } from "@/components/level-test/TestRunner";
import { ResultScreen } from "@/components/level-test/ResultScreen";
import type { SubmitResult } from "@/components/level-test/types";

type View = "lobby" | "test" | "result";

export default function LevelTestPage() {
  const { user } = useCurrentUser();

  const [view,       setView]       = useState<View>("lobby");
  const [testId,     setTestId]     = useState<number | null>(null);
  const [result,     setResult]     = useState<SubmitResult | null>(null);

  const userLevel = user?.jlpt_level ?? "n5";

  function startTest(id: number) {
    setTestId(id);
    setResult(null);
    setView("test");
  }

  function handleResult(res: SubmitResult) {
    setResult(res);
    setView("result");
  }

  function goLobby() {
    setTestId(null);
    setResult(null);
    setView("lobby");
  }

  if (view === "test" && testId !== null) {
    return (
      <TestRunner
        testId={testId}
        onResult={handleResult}
        onCancel={goLobby}
      />
    );
  }

  if (view === "result" && result !== null && testId !== null) {
    return (
      <ResultScreen
        result={result}
        onRetry={() => startTest(testId)}
        onHome={goLobby}
      />
    );
  }

  return (
    <LevelTestLobby
      userLevel={userLevel}
      onStartTest={startTest}
    />
  );
}
