"use client";

import { useState } from "react";

interface Props {
  /** Callback to re-trigger the AI request */
  onRetry?: () => void;
  /** Cached text to show while retrying */
  cachedContent?: string;
  /** Error message from the failed stream */
  errorMessage?: string;
}

/**
 * Fallback UI shown when an AI streaming request fails.
 * Shows the last cached response (if available) and a retry button.
 */
export function AIStreamFallback({ onRetry, cachedContent, errorMessage }: Props) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      {/* Error notice */}
      <div className="flex items-start gap-2">
        <span className="text-amber-500 mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-amber-800">
            Không thể kết nối tới AI
          </p>
          {errorMessage && (
            <p className="text-xs text-amber-600 mt-0.5">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Cached content (if available) */}
      {cachedContent && (
        <div className="rounded-lg bg-white border border-amber-100 p-3">
          <p className="text-xs text-amber-500 mb-1">Nội dung được lưu trữ:</p>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {cachedContent}
          </div>
        </div>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {retrying ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang thử lại...
            </>
          ) : (
            <>↻ Thử lại</>
          )}
        </button>
      )}
    </div>
  );
}

export default AIStreamFallback;
