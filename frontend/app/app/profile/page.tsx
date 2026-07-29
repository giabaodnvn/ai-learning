"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LEVEL_JP } from "@/lib/levels";
import { VIP_TIERS, vipTier } from "@/lib/vip";
import { formatBalance, formatDate } from "@/lib/format";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import Image from "next/image";
import coverImage from "@/app/images/4.jpg";

export default function ProfilePage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-52 rounded-2xl bg-zinc-200" />
        <div className="h-28 rounded-2xl bg-zinc-100" />
        <div className="h-44 rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (!user) return null;

  const vip = vipTier(user.vip_level);
  const initials = (user.name || user.email)[0].toUpperCase();

  return (
    <div className="max-w-2xl space-y-5 animate-slide-up">

      {/* ── Identity card ─────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">

        {/* Cover image */}
        <div className="relative h-44 sm:h-52">
          <Image
            src={coverImage}
            alt="Khu rừng Ghibli"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 to-transparent" />

          {/* Name overlay on cover */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-800 ring-4 ring-white shadow-lg shrink-0">
              {initials}
            </div>
            <div className="mb-0.5">
              <p className="text-lg font-bold text-white leading-tight drop-shadow">
                {user.name || "(Chưa đặt tên)"}
              </p>
              <p className="text-xs text-white/70">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-6 py-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
            <span className="text-lg leading-none">{LEVEL_JP[user.jlpt_level]}</span>
            <div>
              <p className="text-[10px] text-indigo-400 leading-none">Trình độ</p>
              <p className="text-sm font-bold text-indigo-700 leading-tight">
                {user.jlpt_level.toUpperCase()}
              </p>
            </div>
          </div>

          {user.streak_count > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5">
              <span className="text-lg leading-none">🔥</span>
              <div>
                <p className="text-[10px] text-orange-400 leading-none">Streak</p>
                <p className="text-sm font-bold text-orange-600 leading-tight">
                  {user.streak_count} ngày
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-2.5">
            <span className="text-lg leading-none">📅</span>
            <div>
              <p className="text-[10px] text-zinc-400 leading-none">Thành viên</p>
              <p className="text-sm font-bold text-zinc-600 leading-tight">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIP status card ────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden border ${vip.borderClass} bg-white shadow-sm`}>
        {/* Gradient header bar */}
        <div className={`h-1.5 bg-gradient-to-r ${vip.headerClass}`} />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-400 mb-1.5">Gói thành viên</p>
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${vip.badgeClass}`}>
                {vip.label}
              </span>
              <p className="mt-2 text-sm text-zinc-500">{vip.desc}</p>
            </div>
            <div className="text-right shrink-0 space-y-2">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Hết hạn</p>
                <p className="text-sm font-semibold text-zinc-700">{formatDate(user.vip_expires_at)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Số dư</p>
                <p className="text-sm font-semibold text-zinc-700">{formatBalance(user.balance)}</p>
              </div>
            </div>
          </div>

          {/* Tier progress bar */}
          <div className="mt-5 flex gap-1.5">
            {VIP_TIERS.map((tier) => {
              const active = tier.level === user.vip_level;
              const achieved = tier.level < user.vip_level;
              return (
                <div key={tier.level} className="flex-1 text-center">
                  <div
                    className={`h-1.5 rounded-full mb-1.5 ${
                      active
                        ? `bg-gradient-to-r ${tier.headerClass}`
                        : achieved
                        ? "bg-zinc-300"
                        : "bg-zinc-100"
                    }`}
                  />
                  <span className={`text-[10px] font-semibold ${
                    active ? "text-zinc-800" : achieved ? "text-zinc-400 line-through" : "text-zinc-300"
                  }`}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>

          {user.vip_level === 3 && (
            <p className="mt-3 text-xs text-amber-600 font-medium text-center">
              ✦ Bạn đang ở gói cao nhất!
            </p>
          )}
        </div>
      </div>

      <ProfileForm
        currentName={user.name}
        email={user.email}
        jlptLevel={user.jlpt_level}
      />

      <PasswordForm />

    </div>
  );
}
