import type { ReactNode } from "react";

interface Props {
  /** Optional emoji shown above the message. */
  icon?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Layout-only classes. */
  className?: string;
}

/** Dashed placeholder box shown when a list has nothing in it yet. */
export function EmptyState({ icon, title, subtitle, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-zinc-300 px-4 py-10 text-center ${className}`}
    >
      {icon && <p className="text-2xl mb-2">{icon}</p>}
      <p className="text-sm text-zinc-500">{title}</p>
      {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
    </div>
  );
}
