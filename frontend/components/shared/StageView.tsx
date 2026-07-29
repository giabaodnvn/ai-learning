"use client";

import { useState, type ReactNode } from "react";
import { BackButton } from "@/components/BackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIStreamFallback } from "@/components/AIStreamFallback";

interface Props {
  /** Label of the back link above the content. */
  backLabel: string;
  onBack: () => void;
  /** Shown inside the retry card when the stage throws. */
  errorMessage: string;
  children: ReactNode;
}

/**
 * One non-list stage of the reading / listening flows: a back link plus an
 * error boundary whose retry button remounts the stage.
 *
 * Both screens repeated this wrapper for each of their three stages, along with
 * the `errorKey` counter that makes "Thử lại" actually re-run the failed
 * request. Owning that counter here is what lets the pages drop it entirely —
 * a page-level key could only ever remount every stage at once.
 */
export function StageView({ backLabel, onBack, errorMessage, children }: Props) {
  const [errorKey, setErrorKey] = useState(0);

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label={backLabel} />
      <ErrorBoundary
        key={errorKey}
        fallback={
          <AIStreamFallback
            errorMessage={errorMessage}
            onRetry={() => setErrorKey((k) => k + 1)}
          />
        }
      >
        {children}
      </ErrorBoundary>
    </div>
  );
}
