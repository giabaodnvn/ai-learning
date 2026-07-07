import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";
const SERVER_BASE_URL =
  process.env.INTERNAL_API_URL ?? BASE_URL;

// Cached JWT, kept in sync with the NextAuth session by <AuthTokenSync> in
// components/providers.tsx. This avoids the /api/auth/session network round-trip
// that getSession() makes on every request. Sentinel values:
//   undefined = not yet synced (fall back to a one-off getSession)
//   null      = synced, no active session
let authToken: string | null | undefined = undefined;

export function setApiToken(token: string | null) {
  authToken = token;
}

// Resolve the current JWT: use the in-memory cache once synced, otherwise
// fall back to a single getSession() call (only before the provider mounts).
export async function resolveToken(): Promise<string | null> {
  if (authToken !== undefined) return authToken;
  return (await getSession())?.accessToken ?? null;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach JWT from the cached NextAuth session on every request (client-side only)
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const token = await resolveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401 (expired/revoked JWT), sign out and redirect to login instead of
// leaving the user stuck on a dead screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      signOut({ callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

// Server-side helper: create an api instance with an explicit token
export function serverApi(token: string) {
  return axios.create({
    baseURL: SERVER_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
