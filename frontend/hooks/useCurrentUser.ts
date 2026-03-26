import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  jlpt_level: string;
  role: string;
  streak_count: number;
  last_studied_at: string | null;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const query = useQuery<CurrentUser>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await api.get("/api/v1/auth/me");
      return res.data.data;
    },
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000, // 5 min
  });

  return {
    user: query.data,
    session,
    isLoading: status === "loading" || query.isLoading,
    isAuthenticated: status === "authenticated",
  };
}
