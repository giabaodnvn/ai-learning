"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { LEVELS_META, LEVEL_JP } from "@/lib/levels";
import Image from "next/image";
import coverImage from "@/app/images/4.jpg";

const VIP_CONFIG: Record<number, {
  label: string; desc: string;
  headerClass: string; badgeClass: string; borderClass: string;
}> = {
  0: {
    label: "Free",
    desc: "Truy cập các tính năng học tập cơ bản.",
    headerClass: "from-zinc-700 to-zinc-500",
    badgeClass: "bg-zinc-100 text-zinc-700",
    borderClass: "border-zinc-200",
  },
  1: {
    label: "Basic",
    desc: "Mở khóa thêm bài tập và lịch sử học tập.",
    headerClass: "from-blue-700 to-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
    borderClass: "border-blue-200",
  },
  2: {
    label: "Pro",
    desc: "AI không giới hạn, tất cả bài kiểm tra cấp độ.",
    headerClass: "from-purple-700 to-violet-500",
    badgeClass: "bg-purple-100 text-purple-700",
    borderClass: "border-purple-200",
  },
  3: {
    label: "Premium",
    desc: "Toàn quyền truy cập, ưu tiên hỗ trợ.",
    headerClass: "from-amber-600 to-orange-400",
    badgeClass: "bg-amber-100 text-amber-700",
    borderClass: "border-amber-200",
  },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatBalance(raw: string) {
  const n = parseFloat(raw);
  return isNaN(n) ? "0₫" : n.toLocaleString("vi-VN") + "₫";
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, isLoading } = useCurrentUser();

  const [name, setName] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const res = await api.patch("/api/v1/auth/me", { user: payload });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) => {
      const msg = err.response?.data?.errors?.join(", ") ?? "Có lỗi xảy ra.";
      setSaveError(msg);
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError]     = useState<string | null>(null);

  const passwordMutation = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const res = await api.patch("/api/v1/auth/password", payload);
      return res.data;
    },
    onSuccess: () => {
      setPwSuccess(true);
      setPwError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: (err: { response?: { data?: { error?: string; errors?: string[] } } }) => {
      const data = err.response?.data;
      setPwError(data?.error ?? data?.errors?.join(", ") ?? "Có lỗi xảy ra.");
    },
  });

  function handleChangePassword() {
    setPwSuccess(false);
    setPwError(null);
    if (newPassword.length < 6) {
      setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Xác nhận mật khẩu không khớp.");
      return;
    }
    passwordMutation.mutate({ current_password: currentPassword, new_password: newPassword });
  }

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

  const vip = VIP_CONFIG[user.vip_level] ?? VIP_CONFIG[0];
  const displayName = name ?? user.name ?? "";
  const initials = (user.name || user.email)[0].toUpperCase();
  const isDirty = name !== null && name !== user.name;

  function handleSave() {
    setSaveSuccess(false);
    setSaveError(null);
    updateMutation.mutate({ name: displayName });
  }

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
            {Object.entries(VIP_CONFIG).map(([lvl, cfg]) => {
              const level = Number(lvl);
              const active = level === user.vip_level;
              const achieved = level < user.vip_level;
              return (
                <div key={lvl} className="flex-1 text-center">
                  <div
                    className={`h-1.5 rounded-full mb-1.5 ${
                      active
                        ? `bg-gradient-to-r ${cfg.headerClass}`
                        : achieved
                        ? "bg-zinc-300"
                        : "bg-zinc-100"
                    }`}
                  />
                  <span className={`text-[10px] font-semibold ${
                    active ? "text-zinc-800" : achieved ? "text-zinc-400 line-through" : "text-zinc-300"
                  }`}>
                    {cfg.label}
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

      {/* ── Edit form ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
        <h2 className="text-sm font-semibold text-zinc-800 mb-5">Chỉnh sửa thông tin</h2>

        {saveSuccess && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Cập nhật thành công.
          </div>
        )}
        {saveError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Trình độ JLPT</label>
            <select
              value={user.jlpt_level}
              disabled
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed appearance-none"
            >
              {LEVELS_META.map(({ value, labelVi }) => (
                <option key={value} value={value}>{labelVi}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">Trình độ được cập nhật qua bài kiểm tra cấp độ.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
          >
            {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* ── Change password ────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
        <h2 className="text-sm font-semibold text-zinc-800 mb-5">Đổi mật khẩu</h2>

        {pwSuccess && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Đổi mật khẩu thành công.
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {pwError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <p className="mt-1 text-xs text-zinc-400">Tối thiểu 6 ký tự.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || passwordMutation.isPending}
            className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
          >
            {passwordMutation.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </div>
      </div>

    </div>
  );
}
