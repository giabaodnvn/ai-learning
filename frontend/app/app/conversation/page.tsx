"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { JLPT_LEVELS as LEVELS } from "@/types/quiz";
import { CONVERSATION_ROLES as ROLES } from "@/lib/roles";

interface SessionSummary {
  id: number;
  role: string;
  role_name_vi: string;
  role_icon: string;
  jlpt_level: string;
  message_count: number;
  last_message_at: string;
  preview: string | null;
}

export default function ConversationPage() {
  const { data: session } = useSession();
  const { user } = useCurrentUser();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<string>("tutor");
  const [selectedLevel, setSelectedLevel] = useState<string>("n5");
  const [starting, setStarting] = useState(false);
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Sync level with user's JLPT level once loaded
  useEffect(() => {
    if (user?.jlpt_level) setSelectedLevel(user.jlpt_level);
  }, [user?.jlpt_level]);

  const fetchHistory = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await api.get("/api/v1/conversations");
      setHistory(res.data);
    } catch {
      // Non-401 failure (401 is handled globally by the api interceptor).
      // Leave the history empty rather than throwing an unhandled rejection.
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleStart() {
    if (!session?.accessToken || starting) return;
    setStarting(true);
    try {
      const res = await api.post("/api/v1/conversations", {
        role: selectedRole,
        jlpt_level: selectedLevel,
      });
      router.push(`/app/conversation/${res.data.id}`);
    } catch {
      setStarting(false);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.accessToken) return;
    try {
      await api.delete(`/api/v1/conversations/${id}`);
      setHistory((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silently ignore delete failure — item stays in list
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Hội thoại AI</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện nói tiếng Nhật qua các tình huống thực tế. Mỗi phiên được lưu lại để tiếp tục sau.
        </p>
      </div>

      {/* New session card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
        <p className="text-sm font-semibold text-zinc-800">Bắt đầu phiên mới</p>

        {/* Role grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                selectedRole === r.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <span className={`text-sm font-medium ${selectedRole === r.value ? "text-indigo-700" : "text-zinc-800"}`}>
                {r.label}
              </span>
              <span className="text-xs text-zinc-500 leading-tight">{r.desc}</span>
            </button>
          ))}
        </div>

        {/* Level picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-zinc-600">Trình độ:</span>
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setSelectedLevel(lv)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selectedLevel === lv
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {lv.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {starting ? "Đang tạo..." : "Bắt đầu hội thoại"}
        </button>
      </div>

      {/* History */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-800">Phiên trước đây</p>

        {loadingHistory ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">Chưa có phiên hội thoại nào.</p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/app/conversation/${s.id}`)}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-colors group"
              >
                <span className="text-2xl flex-shrink-0">{s.role_icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800">{s.role_name_vi}</span>
                    <span className="text-xs text-zinc-400 font-semibold">{s.jlpt_level.toUpperCase()}</span>
                    <span className="text-xs text-zinc-400">{s.message_count} tin nhắn</span>
                  </div>
                  {s.preview && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{s.preview}</p>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="ml-2 flex-shrink-0 rounded p-1 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa phiên này"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 1 0" />
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
