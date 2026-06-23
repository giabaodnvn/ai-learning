"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";
import { streamSSE } from "@/lib/sse";

interface SSEState {
  text: string;
  streaming: boolean;
  error: string | null;
  done: boolean;
}

/**
 * useSSE — consume a Rails SSE (text/event-stream) GET endpoint.
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

  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) return;

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState({ text: "", streaming: true, error: null, done: false });

    let accumulated = "";

    (async () => {
      try {
        const token = (await getSession())?.accessToken ?? "";
        await streamSSE(url, { token, signal: ctrl.signal }, (payload) => {
          if (payload.error) {
            setState({ text: accumulated, streaming: false, error: payload.error, done: false });
            return true;
          }
          if (payload.delta) accumulated += payload.delta;
          setState({ text: accumulated, streaming: !payload.done, error: null, done: !!payload.done });
          if (payload.done) return true;
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setState((s) => ({ ...s, streaming: false, error: "Lỗi kết nối" }));
        }
      } finally {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, streaming: false }));
      }
    })();

    return () => {
      ctrl.abort();
    };
  }, [url]);

  const reset = useCallback(() => {
    ctrlRef.current?.abort();
    setState({ text: "", streaming: false, error: null, done: false });
  }, []);

  return { ...state, reset };
}
