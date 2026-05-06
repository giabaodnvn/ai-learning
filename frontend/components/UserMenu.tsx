"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const JLPT_LABELS: Record<string, string> = {
  n5: "N5", n4: "N4", n3: "N3", n2: "N2", n1: "N1",
};

const VIP_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: "Free",    className: "bg-white/10 text-indigo-200" },
  1: { label: "Basic",   className: "bg-blue-500/30 text-blue-200" },
  2: { label: "Pro",     className: "bg-purple-500/30 text-purple-200" },
  3: { label: "Premium", className: "bg-amber-500/30 text-amber-200" },
};

export function UserMenu() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="h-8 w-36 animate-pulse rounded-lg bg-white/10" />;
  }

  if (!user) return null;

  const vip = VIP_CONFIG[user.vip_level] ?? VIP_CONFIG[0];
  const initials = (user.name || user.email)[0].toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar + name */}
      <Link href="/app/profile" className="flex items-center gap-2 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/30 text-sm font-bold text-white ring-1 ring-white/20 group-hover:bg-indigo-400/50 transition-all">
          {initials}
        </div>
        <div className="hidden sm:block leading-none">
          <p className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
            {user.name || user.email}
          </p>
          <p className="text-[10px] text-indigo-300/80 mt-0.5">{user.email}</p>
        </div>
      </Link>

      {/* Badges */}
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200 ring-1 ring-indigo-400/30">
          {JLPT_LABELS[user.jlpt_level] ?? user.jlpt_level.toUpperCase()}
        </span>
        {user.vip_level > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${vip.className}`}>
            {vip.label}
          </span>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-white/15 hover:text-white transition-all"
      >
        Đăng xuất
      </button>
    </div>
  );
}
