"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const JLPT_LABELS: Record<string, string> = {
  n5: "N5", n4: "N4", n3: "N3", n2: "N2", n1: "N1",
};

const VIP_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: "Free",    className: "bg-zinc-100 text-zinc-500" },
  1: { label: "Basic",   className: "bg-blue-100 text-blue-700" },
  2: { label: "Pro",     className: "bg-purple-100 text-purple-700" },
  3: { label: "Premium", className: "bg-amber-100 text-amber-700" },
};

export function UserMenu() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (!user) return null;

  const vip = VIP_CONFIG[user.vip_level] ?? VIP_CONFIG[0];

  return (
    <div className="flex items-center gap-3">
      <Link href="/app/profile" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 group-hover:bg-indigo-200 transition-colors">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-zinc-900 group-hover:text-indigo-700 transition-colors">
            {user.name || user.email}
          </p>
          <p className="text-xs text-zinc-400">{user.email}</p>
        </div>
      </Link>

      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {JLPT_LABELS[user.jlpt_level] ?? user.jlpt_level}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vip.className}`}>
          {vip.label}
        </span>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        Đăng xuất
      </button>
    </div>
  );
}
