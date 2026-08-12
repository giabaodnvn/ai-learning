"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import bgImage from "@/app/images/5.jpg";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";

const FIELDS = [
  { name: "name",                  label: "Họ tên",             type: "text",     placeholder: "Nguyễn Văn A" },
  { name: "email",                 label: "Email",              type: "email",    placeholder: "you@example.com" },
  { name: "password",              label: "Mật khẩu",           type: "password", placeholder: "Tối thiểu 6 ký tự", minLength: 6 },
  { name: "password_confirmation", label: "Xác nhận mật khẩu",  type: "password", placeholder: "Nhập lại mật khẩu" },
] as const;

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
    } catch (err) {
      const messages = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors;
      setError(Array.isArray(messages) ? messages.join(", ") : "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      image={bgImage}
      imageAlt="My Neighbor Totoro"
      caption="となりのトトロ — My Neighbor Totoro"
      tagline={
        <>
          <p className="text-base text-white/85 leading-relaxed font-medium">
            Bắt đầu hành trình học tiếng Nhật —<br />
            cùng AI, theo cách của bạn.
          </p>
          <div className="mt-5 flex gap-4 text-xs text-white/50">
            <span>✓ Từ N5 đến N1</span>
            <span>✓ SRS thông minh</span>
            <span>✓ AI giải thích tiếng Việt</span>
          </div>
        </>
      }
      title="Tạo tài khoản"
      subtitle="Miễn phí mãi mãi. ようこそ！"
      error={error}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {FIELDS.map(({ name, label, type, placeholder, ...rest }) => (
          <AuthField
            key={name}
            name={name}
            label={label}
            type={type}
            placeholder={placeholder}
            required
            value={form[name]}
            onChange={handleChange}
            {...rest}
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200 mt-1"
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng ký →"}
        </button>
      </form>
    </AuthLayout>
  );
}
