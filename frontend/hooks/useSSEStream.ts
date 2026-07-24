"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamSSE, type StreamSSEOptions } from "@/lib/sse";

const DEFAULT_NETWORK_ERROR = "Mất kết nối. Vui lòng thử lại.";

export interface UseSSEStreamOptions {
  /** Called once when the stream finishes cleanly, with the full accumulated text. */
  onDone?: (content: string) => void;
  /** Map a server `error` payload code to a user-facing message. */
  errorMessage?: (code: string) => string;
  /** Message shown when the connection itself fails (non-abort fetch error). */
  networkError?: string;
}

export interface UseSSEStreamResult {
  /** Text accumulated from `delta` events so far. */
  content: string;
  streaming: boolean;
  error: string | null;
  /** Begin a stream. Aborts any previous one and resets content/error. */
  start: (path: string, options?: StreamSSEOptions) => Promise<void>;
  /** Abort the current stream and clear content/error. */
  reset: () => void;
}

/**
 * useSSEStream — consume an SSE text endpoint into React state.
 *
 * Centralises the AbortController lifecycle (cancel-previous + cancel-on-unmount)
 * and normalises the `delta` / `error` / `done` payload handling that was
 * previously copy-pasted across every streaming component.
 */
export function useSSEStream(options: UseSSEStreamOptions = {}): UseSSEStreamResult {
  const [content, setContent]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep the latest callbacks without destabilising `start`/`reset` identity.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setContent("");
    setError(null);
    setStreaming(false);
  }, []);

  const start = useCallback(async (path: string, streamOptions: StreamSSEOptions = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent("");
    setError(null);
    setStreaming(true);

    let buffer = "";
    try {
      await streamSSE(path, { ...streamOptions, signal: controller.signal }, (payload) => {
        if (payload.error) {
          const code = String(payload.error);
          setError(optionsRef.current.errorMessage?.(code) ?? optionsRef.current.networkError ?? DEFAULT_NETWORK_ERROR);
          return true;
        }
        if (payload.delta) {
          buffer += payload.delta;
          setContent(buffer);
        }
        if (payload.done) {
          optionsRef.current.onDone?.(buffer);
          return true;
        }
      });
    } catch (err) {
      // A newer stream (or unmount) aborted this one — not an error to show.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(optionsRef.current.networkError ?? DEFAULT_NETWORK_ERROR);
    } finally {
      // Only the most recent stream owns the streaming flag.
      if (abortRef.current === controller) setStreaming(false);
    }
  }, []);

  return { content, streaming, error, start, reset };
}
