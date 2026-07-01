"use client";

interface BackButtonProps {
  onClick: () => void;
  label: string;
}

export function BackButton({ onClick, label }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
    >
      ← {label}
    </button>
  );
}
