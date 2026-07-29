"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FormCard, SubmitButton } from "./FormCard";
import { TextField } from "./TextField";

const MIN_LENGTH = 6;

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const res = await api.patch("/api/v1/auth/password", payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setCurrent("");
      setNext("");
      setConfirm("");
      // Changing the password revokes every JWT already issued for this
      // account, so the current session is dead. Sign out deliberately instead
      // of leaving the user to hit a 401 on their next action.
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
    },
    onError: (err: { response?: { data?: { error?: string; errors?: string[] } } }) => {
      const data = err.response?.data;
      setError(data?.error ?? data?.errors?.join(", ") ?? "Có lỗi xảy ra.");
    },
  });

  function submit() {
    setSuccess(false);
    setError(null);

    if (next.length < MIN_LENGTH) {
      setError(`Mật khẩu mới phải có ít nhất ${MIN_LENGTH} ký tự.`);
      return;
    }
    if (next !== confirm) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    mutation.mutate({ current_password: current, new_password: next });
  }

  return (
    <FormCard
      title="Đổi mật khẩu"
      success={success ? "Đổi mật khẩu thành công. Đang đăng xuất để bạn đăng nhập lại…" : null}
      error={error}
    >
      <TextField
        label="Mật khẩu hiện tại"
        type="password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <TextField
        label="Mật khẩu mới"
        type="password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        hint={`Tối thiểu ${MIN_LENGTH} ký tự.`}
      />
      <TextField
        label="Xác nhận mật khẩu mới"
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      <SubmitButton
        onClick={submit}
        disabled={!current || !next || !confirm}
        pending={mutation.isPending}
        label="Đổi mật khẩu"
        pendingLabel="Đang đổi..."
      />
    </FormCard>
  );
}
