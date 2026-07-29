"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  /** Shown in a green banner above the fields. */
  success?: string | null;
  /** Shown in a red banner above the fields. */
  error?: string | null;
  children: ReactNode;
}

/** Settings card: title, an optional result banner, then the fields. */
export function FormCard({ title, success, error, children }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
      <h2 className="text-sm font-semibold text-zinc-800 mb-5">{title}</h2>

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Full-width submit button shared by the settings forms. */
export function SubmitButton({
  onClick,
  disabled,
  pending,
  label,
  pendingLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
