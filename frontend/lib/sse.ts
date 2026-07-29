"use client";

import { signOut } from "next-auth/react";
import { resolveToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface StreamSSEOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** JWT bearer token; if omitted it is pulled from the NextAuth session. */
  token?: string;
  signal?: AbortSignal;
}

/**
 * Vietnamese message for the `error` codes SseStreamable emits
 * ("rate_limit" | "timeout" | "server_error"). Without this the raw code leaks
 * into the UI, which is what the chat screen used to show.
 */
const SSE_ERROR_MESSAGES: Record<string, string> = {
  rate_limit:   "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau.",
  timeout:      "AI phản hồi quá lâu. Vui lòng thử lại.",
  server_error: "Lỗi kết nối AI. Vui lòng thử lại.",
};

export const DEFAULT_SSE_ERROR = "Mất kết nối. Vui lòng thử lại.";

export function sseErrorMessage(code: string): string {
  return SSE_ERROR_MESSAGES[code] ?? DEFAULT_SSE_ERROR;
}

/** A parsed `data:` JSON event. Common fields are typed; extras are `unknown`. */
export interface SSEPayload {
  delta?: string;
  content?: string;
  done?: boolean;
  error?: string;
  type?: string;
  translation_vi?: string;
  [key: string]: unknown;
}

/**
 * streamSSE — consume a Rails `text/event-stream` endpoint.
 *
 * Handles auth, request body, and cross-chunk line buffering (a `data:` line
 * split across two network chunks is reassembled before parsing), then invokes
 * `onEvent` with each parsed JSON payload. Return `true` from `onEvent` to stop
 * early (e.g. on a terminal "done" event).
 *
 * Throws "Lỗi kết nối" on a non-OK response or missing body. When `signal`
 * aborts, the underlying fetch rejects with an AbortError the caller can ignore.
 */
export async function streamSSE(
  path: string,
  options: StreamSSEOptions,
  onEvent: (payload: SSEPayload) => boolean | void,
): Promise<void> {
  const token = options.token ?? (await resolveToken()) ?? "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  // Mirror the axios 401 interceptor: an expired/revoked JWT during a stream
  // must sign the user out, not just surface a generic connection error.
  if (res.status === 401) {
    if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  if (!res.ok || !res.body) throw new Error("Lỗi kết nối");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let payload: SSEPayload;
        try {
          payload = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (onEvent(payload) === true) return;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/**
 * Consume a plain-text SSE endpoint and resolve with the whole reply.
 *
 * For background prefetching, where there is no UI to stream into. Rejects
 * unless the stream ended with a `done` event, so a truncated or server-errored
 * reply is never mistaken for a complete one and cached as such.
 */
export async function bufferSSE(path: string, options: StreamSSEOptions = {}): Promise<string> {
  let result = "";
  let complete = false;

  await streamSSE(path, options, (payload) => {
    if (payload.error) return true;
    if (payload.done) {
      complete = true;
      return true;
    }
    result += payload.delta ?? "";
  });

  if (!complete) throw new Error("Stream kết thúc sớm");
  return result;
}
