"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { vipTier } from "@/lib/vip";

// Clearing the NextAuth cookie only ends the browser session — the Rails JWT it
// carried stays valid until it expires (a full day). Rotate the user's jti
// server-side first so a leaked token dies with the logout.
async function logout() {
  try {
    await api.post("/api/v1/auth/sign_out");
  } catch {
    // Revocation is best-effort: never trap the user in a signed-in UI.
  }
  await signOut({ callbackUrl: "/login" });
}

export function UserMenu() {
  const { user, isLoading } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading) {
    return <div className="h-8 w-36 animate-pulse rounded-lg bg-white/10" />;
  }

  if (!user) return null;

  const vip = vipTier(user.vip_level);
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
          {user.jlpt_level.toUpperCase()}
        </span>
        {user.vip_level > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${vip.headerBadgeClass}`}>
            {vip.label}
          </span>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          setLoggingOut(true);
          void logout();
        }}
        disabled={loggingOut}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-white/15 hover:text-white transition-all disabled:opacity-50"
      >
        {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
    </div>
  );
}
