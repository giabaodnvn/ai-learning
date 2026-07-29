import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Tighter padding + smaller text, for banners squeezed into a chat composer. */
  compact?: boolean;
  /** Layout-only classes (margin, flex) — not colours or text size. */
  className?: string;
}

/**
 * The red "something went wrong" strip. Nine screens had their own copy, which
 * had drifted between rounded-lg and rounded-xl and between px-3 and px-4.
 */
export function ErrorBanner({ children, compact = false, className = "" }: Props) {
  const size = compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";

  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 text-red-700 ${size} ${className}`}>
      {children}
    </div>
  );
}
