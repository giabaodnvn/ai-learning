import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/api";
import { redirect } from "next/navigation";

const JLPT_LABELS: Record<string, string> = {
  n5: "N5 – Sơ cấp", n4: "N4 – Sơ trung", n3: "N3 – Trung cấp",
  n2: "N2 – Trung cao", n1: "N1 – Cao cấp",
};

async function getCurrentUser(token: string) {
  const res = await serverApi(token).get("/api/v1/auth/me");
  return res.data.data;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await getCurrentUser(session.accessToken);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-6">
        <h1 className="text-xl font-bold text-zinc-900">
          Xin chào, {user.name} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Trình độ hiện tại:{" "}
          <span className="font-semibold text-indigo-600">
            {JLPT_LABELS[user.jlpt_level] ?? user.jlpt_level}
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Chuỗi ngày học" value={`${user.streak_count} ngày`} />
        <StatCard
          label="Lần học gần nhất"
          value={
            user.last_studied_at
              ? new Date(user.last_studied_at).toLocaleDateString("vi-VN")
              : "Chưa có"
          }
        />
        <StatCard label="Vai trò" value={user.role === "admin" ? "Admin" : "Học viên"} />
      </div>

      {/* Quick links */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-6">
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Bắt đầu học</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Từ vựng", href: "/app/vocabulary", emoji: "📖" },
            { label: "Ngữ pháp", href: "/app/grammar", emoji: "📝" },
            { label: "Hội thoại AI", href: "/app/conversation", emoji: "🤖" },
            { label: "Đọc hiểu", href: "/app/reading", emoji: "📰" },
            { label: "Luyện tập SRS", href: "/app/review", emoji: "🔁" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-white transition-colors"
            >
              <span>{item.emoji}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
