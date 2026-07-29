"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LEVELS_META } from "@/lib/levels";
import { FormCard, SubmitButton } from "./FormCard";
import { TextField } from "./TextField";

interface Props {
  currentName: string | null;
  email: string;
  jlptLevel: string;
}

/** Editable display name; email and JLPT level are read-only here. */
export function ProfileForm({ currentName, email, jlptLevel }: Props) {
  const queryClient = useQueryClient();

  // null = untouched, so "dirty" can be told apart from "cleared".
  const [name, setName]       = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const res = await api.patch("/api/v1/auth/me", { user: payload });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) => {
      setError(err.response?.data?.errors?.join(", ") ?? "Có lỗi xảy ra.");
    },
  });

  const displayName = name ?? currentName ?? "";
  const isDirty     = name !== null && name !== currentName;

  return (
    <FormCard
      title="Chỉnh sửa thông tin"
      success={success ? "Cập nhật thành công." : null}
      error={error}
    >
      <TextField
        label="Tên hiển thị"
        value={displayName}
        onChange={setName}
        placeholder="Nhập tên của bạn"
      />

      <div>
        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Trình độ JLPT</label>
        <select
          value={jlptLevel}
          disabled
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed appearance-none"
        >
          {LEVELS_META.map(({ value, labelVi }) => (
            <option key={value} value={value}>{labelVi}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-400">Trình độ được cập nhật qua bài kiểm tra cấp độ.</p>
      </div>

      <TextField label="Email" value={email} type="email" disabled />

      <SubmitButton
        onClick={() => {
          setSuccess(false);
          setError(null);
          mutation.mutate({ name: displayName });
        }}
        disabled={!isDirty}
        pending={mutation.isPending}
        label="Lưu thay đổi"
        pendingLabel="Đang lưu..."
      />
    </FormCard>
  );
}
