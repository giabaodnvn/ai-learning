"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { setApiToken } from "@/lib/api";

// Mirrors the NextAuth session's JWT into the api-layer cache so axios/SSE
// don't hit /api/auth/session on every request. Skips the "loading" phase so
// requests made before the session resolves fall back to a one-off getSession.
function AuthTokenSync() {
  const { data, status } = useSession();
  useEffect(() => {
    if (status === "loading") return;
    setApiToken(data?.accessToken ?? null);
  }, [status, data?.accessToken]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <AuthTokenSync />
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV !== "production" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
