"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import bgImage from "@/app/images/5.jpg";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password_confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/sign_up", { user: form });
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng thử lại.");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      const messages = err?.response?.data?.errors;
      setError(Array.isArray(messages) ? messages.join(", ") : "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: Ghibli image ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src={bgImage}
          alt="My Neighbor Totoro"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

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
            Bắt đầu hành trình học tiếng Nhật —<br />
            cùng AI, theo cách của bạn.
          </p>
          <div className="mt-5 flex gap-4 text-xs text-white/50">
            <span>✓ Từ N5 đến N1</span>
            <span>✓ SRS thông minh</span>
            <span>✓ AI giải thích tiếng Việt</span>
          </div>
          <p className="mt-4 text-xs text-white/35 italic">
            となりのトトロ — My Neighbor Totoro
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mb-7">Miễn phí mãi mãi. ようこそ！</p>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {[
              { name: "name",                  label: "Họ tên",              type: "text",     placeholder: "Nguyễn Văn A",    required: true,  minLength: undefined },
              { name: "email",                 label: "Email",               type: "email",    placeholder: "you@example.com", required: true,  minLength: undefined },
              { name: "password",              label: "Mật khẩu",            type: "password", placeholder: "Tối thiểu 6 ký tự", required: true, minLength: 6 },
              { name: "password_confirmation", label: "Xác nhận mật khẩu",  type: "password", placeholder: "Nhập lại mật khẩu", required: true, minLength: undefined },
            ].map(({ name, label, type, placeholder, required, minLength }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  name={name}
                  type={type}
                  required={required}
                  minLength={minLength}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200 mt-1"
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng ký →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <a href="/login" className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline">
              Đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
