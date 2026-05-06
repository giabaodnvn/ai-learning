import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { serverApi }        from "@/lib/api";
import { redirect }         from "next/navigation";
import { DashboardStats }   from "./DashboardStats";

const JLPT_LABELS: Record<string, string> = {
  n5: "N5 – Sơ cấp",
  n4: "N4 – Sơ trung",
  n3: "N3 – Trung cấp",
  n2: "N2 – Trung cao",
  n1: "N1 – Cao cấp",
};

const JLPT_JP: Record<string, string> = {
  n5: "初級", n4: "初中級", n3: "中級", n2: "中上級", n1: "上級",
};

const QUICK_LINKS = [
  { label: "Từ vựng",       href: "/app/vocabulary",       kanji: "語", from: "from-blue-600",    to: "to-indigo-700"  },
  { label: "Ngữ pháp",      href: "/app/grammar",          kanji: "文", from: "from-violet-600",  to: "to-purple-700"  },
  { label: "Hội thoại AI",  href: "/app/conversation",     kanji: "話", from: "from-indigo-500",  to: "to-blue-700"    },
  { label: "Đọc hiểu",      href: "/app/reading",          kanji: "読", from: "from-emerald-600", to: "to-teal-700"    },
  { label: "Ôn tập SRS",    href: "/app/review",           kanji: "復", from: "from-amber-500",   to: "to-orange-600"  },
  { label: "Flashcard",     href: "/app/study/flashcard",  kanji: "札", from: "from-rose-500",    to: "to-pink-600"    },
] as const;

async function getCurrentUser(token: string) {
  const res = await serverApi(token).get("/api/v1/auth/me");
  return res.data.data;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await getCurrentUser(session.accessToken);

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Welcome banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 p-6 text-white shadow-lg shadow-indigo-900/20">
        {/* Decorative bg kanji */}
        <span className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 text-[7rem] font-black leading-none text-white/[0.06]">
          学
        </span>

        <div className="relative">
          <p className="text-xs font-medium text-indigo-300 mb-1 tracking-widest uppercase">
            こんにちは！
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.name || "Học viên"}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <span className="text-indigo-300">{JLPT_JP[user.jlpt_level]}</span>
              <span className="text-white">{JLPT_LABELS[user.jlpt_level] ?? user.jlpt_level}</span>
            </span>
            {user.streak_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30">
                🔥 {user.streak_count} ngày liên tiếp
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-indigo-300">
            頑張って！ Hãy tiếp tục luyện tập mỗi ngày để đạt mục tiêu JLPT.
          </p>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <DashboardStats />

      {/* ── Quick links ────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-stone-600 mb-3 px-0.5">
          Bắt đầu học ngay
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${item.from} ${item.to} p-4 text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200`}
            >
              {/* Decorative kanji */}
              <span className="pointer-events-none select-none absolute right-2 bottom-1 text-4xl font-black text-white/10 group-hover:text-white/15 transition-colors">
                {item.kanji}
              </span>
              <span className="relative text-sm font-semibold">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
