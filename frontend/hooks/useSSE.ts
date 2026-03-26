"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

interface SSEState {
  text: string;
  streaming: boolean;
  error: string | null;
  done: boolean;
}

/**
 * useSSE — consume a Rails SSE (text/event-stream) endpoint.
 *
 * Pass a URL string to start streaming; pass null to stay idle.
 * Each SSE event must be: data: {"delta":"...","done":false}
 *
 * Returns { text, streaming, error, done, reset }
 */
export function useSSE(url: string | null) {
  const [state, setState] = useState<SSEState>({
    text: "",
    streaming: false,
    error: null,
    done: false,
  });

  const readerRef   = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!url) return;

    cancelledRef.current = false;
    setState({ text: "", streaming: true, error: null, done: false });

    (async () => {
      try {
        const session = await getSession();
        const res = await fetch(`${API_BASE}${url}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken ?? ""}` },
        });

        if (!res.ok || !res.body) {
          if (!cancelledRef.current)
            setState({ text: "", streaming: false, error: "Lỗi kết nối", done: false });
          return;
        }

        const reader = res.body.getReader();
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { value, done: readDone } = await reader.read();
          if (readDone || cancelledRef.current) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let payload: { delta?: string; done?: boolean; error?: string };
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (payload.error) {
              if (!cancelledRef.current)
                setState({ text: accumulated, streaming: false, error: payload.error, done: false });
              return;
            }

            if (payload.delta) accumulated += payload.delta;
            if (!cancelledRef.current) {
              setState({ text: accumulated, streaming: !payload.done, error: null, done: !!payload.done });
            }
            if (payload.done) return;
          }
        }
      } catch {
        if (!cancelledRef.current)
          setState((s) => ({ ...s, streaming: false, error: "Lỗi kết nối" }));
      } finally {
        if (!cancelledRef.current) setState((s) => ({ ...s, streaming: false }));
        readerRef.current = null;
      }
    })();

    return () => {
      cancelledRef.current = true;
      readerRef.current?.cancel();
      readerRef.current = null;
    };
  }, [url]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    readerRef.current?.cancel();
    readerRef.current = null;
    setState({ text: "", streaming: false, error: null, done: false });
  }, []);

  return { ...state, reset };
}
