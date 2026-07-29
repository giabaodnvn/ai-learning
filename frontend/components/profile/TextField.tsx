"use client";

import type { ReactNode } from "react";

const BASE =
  "w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm transition-all";
const EDITABLE =
  "bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const READONLY = "bg-zinc-50 text-zinc-400 cursor-not-allowed";

interface Props {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  /** Rendered under the field in small grey text. */
  hint?: ReactNode;
  disabled?: boolean;
}

/** Labelled input used by every settings form. */
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  disabled = false,
}: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`${BASE} ${disabled ? READONLY : EDITABLE}`}
      />
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
