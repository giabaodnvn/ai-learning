"use client";

import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface StreamSSEOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** JWT bearer token; if omitted it is pulled from the NextAuth session. */
  token?: string;
  signal?: AbortSignal;
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
  const token = options.token ?? (await getSession())?.accessToken ?? "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

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
