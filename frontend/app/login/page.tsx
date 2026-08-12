"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import bgImage from "@/app/images/6.jpg";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";

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

  return (
    <AuthLayout
      image={bgImage}
      imageAlt="Spirited Away"
      caption="千と千尋の神隠し — Spirited Away"
      tagline={
        <p className="text-base text-white/85 leading-relaxed font-medium">
          Học tiếng Nhật theo phong cách Ghibli —<br />
          mỗi ngày một chút, tiến bộ từng bước.
        </p>
      }
      title="Đăng nhập"
      subtitle="Chào mừng trở lại！いらっしゃいませ"
      error={error}
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline">
            Đăng ký miễn phí
          </Link>
        </>
      }
    >
      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthField
          label="Mật khẩu"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
        </button>
      </form>
    </AuthLayout>
  );
}
