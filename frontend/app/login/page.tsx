"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import bgImage from "@/app/images/6.jpg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Email hoặc mật khẩu không đúng.");
    } else {
      router.push("/app/dashboard");
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/app/dashboard" });
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: Ghibli image ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src={bgImage}
          alt="Spirited Away"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

        {/* Branding text */}
        <div className="relative mt-auto p-10 text-white">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center text-xl font-black backdrop-blur-sm">
              日
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">AI Learning</p>
              <p className="text-xs tracking-widest text-white/60">日本語学習</p>
            </div>
          </div>
          <p className="text-base text-white/85 leading-relaxed font-medium">
            Học tiếng Nhật theo phong cách Ghibli —<br />
            mỗi ngày một chút, tiến bộ từng bước.
          </p>
          <p className="mt-3 text-xs text-white/40 italic">
            千と千尋の神隠し — Spirited Away
          </p>
        </div>
      </div>

      {/* ── Right panel: Form ────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-[#F8F5F0]">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-indigo-900 flex items-center justify-center font-black text-white text-base">日</div>
            <div>
              <p className="font-bold text-gray-900 leading-none">AI Learning</p>
              <p className="text-[10px] text-gray-400 tracking-widest">日本語学習</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mb-7">Chào mừng trở lại！いらっしゃいませ</p>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">hoặc</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </button>

          <p className="mt-7 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <a href="/register" className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline">
              Đăng ký miễn phí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
