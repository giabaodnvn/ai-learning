"use client";

import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const JLPT_LABELS: Record<string, string> = {
  n5: "N5", n4: "N4", n3: "N3", n2: "N2", n1: "N1",
};

export function UserMenu() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-zinc-900">{user.name}</p>
        <p className="text-xs text-zinc-500">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {JLPT_LABELS[user.jlpt_level] ?? user.jlpt_level}
        </span>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
