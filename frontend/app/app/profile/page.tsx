"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";

const JLPT_LEVELS = [
  { value: "n5", label: "N5 – Sơ cấp" },
  { value: "n4", label: "N4 – Sơ trung" },
  { value: "n3", label: "N3 – Trung cấp" },
  { value: "n2", label: "N2 – Trung cao" },
  { value: "n1", label: "N1 – Cao cấp" },
];

const VIP_CONFIG: Record<number, { label: string; desc: string; cardClass: string; badgeClass: string }> = {
  0: {
    label: "Free",
    desc: "Truy cập các tính năng học tập cơ bản.",
    cardClass: "border-zinc-200 bg-zinc-50",
    badgeClass: "bg-zinc-100 text-zinc-600",
  },
  1: {
    label: "Basic",
    desc: "Mở khóa thêm bài tập và lịch sử học tập.",
    cardClass: "border-blue-200 bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  2: {
    label: "Pro",
    desc: "AI không giới hạn, tất cả bài kiểm tra cấp độ.",
    cardClass: "border-purple-200 bg-purple-50",
    badgeClass: "bg-purple-100 text-purple-700",
  },
  3: {
    label: "Premium",
    desc: "Toàn quyền truy cập, ưu tiên hỗ trợ.",
    cardClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-700",
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  if (!user) return null;

  const vip = VIP_CONFIG[user.vip_level] ?? VIP_CONFIG[0];
  const displayName = name ?? user.name ?? "";

  function handleSave() {
    setSaveSuccess(false);
    setSaveError(null);
    updateMutation.mutate({ name: displayName });
  }

  const isDirty = name !== null && name !== user.name;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-zinc-900">Hồ sơ cá nhân</h1>

      {/* Identity card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900">{user.name || "(Chưa đặt tên)"}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Thành viên từ {formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <p className="text-xs text-zinc-400 mb-0.5">Trình độ JLPT</p>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {user.jlpt_level.toUpperCase()}
            </span>
          </div>
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <p className="text-xs text-zinc-400 mb-0.5">Streak</p>
            <p className="font-semibold text-orange-500">🔥 {user.streak_count} ngày</p>
          </div>
        </div>
      </div>

      {/* VIP status */}
      <div className={`rounded-2xl border p-6 ${vip.cardClass}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Gói thành viên</p>
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${vip.badgeClass}`}>
              {vip.label}
            </span>
            <p className="mt-2 text-sm text-zinc-600">{vip.desc}</p>
          </div>
          <div className="text-right space-y-1 shrink-0 ml-4">
            <div>
              <p className="text-xs text-zinc-400">Hết hạn</p>
              <p className="text-sm font-medium text-zinc-700">{formatDate(user.vip_expires_at)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Số dư</p>
              <p className="text-sm font-medium text-zinc-700">{formatBalance(user.balance)}</p>
            </div>
          </div>
        </div>

        {/* VIP tier comparison */}
        {user.vip_level < 3 && (
          <div className="mt-4 pt-4 border-t border-black/5">
            <div className="flex gap-2">
              {Object.entries(VIP_CONFIG).map(([lvl, cfg]) => {
                const level = Number(lvl);
                const active = level === user.vip_level;
                const achieved = level < user.vip_level;
                return (
                  <div
                    key={lvl}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-all ${
                      active
                        ? cfg.badgeClass + " ring-2 ring-offset-1 ring-current"
                        : achieved
                        ? "bg-zinc-100 text-zinc-400 line-through"
                        : "bg-white/60 text-zinc-400"
                    }`}
                  >
                    {cfg.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {user.vip_level === 3 && (
          <p className="mt-4 text-xs text-amber-700 font-medium">Bạn đang ở gói cao nhất!</p>
        )}
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Chỉnh sửa thông tin</h2>

        {saveSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            Cập nhật thành công.
          </div>
        )}
        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Trình độ JLPT</label>
            <select
              value={user.jlpt_level}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            >
              {JLPT_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">Trình độ được cập nhật qua bài kiểm tra cấp độ.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-400">Email không thể thay đổi.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
