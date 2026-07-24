import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const serverBaseUrl =
            process.env.INTERNAL_API_URL ??
            process.env.NEXT_PUBLIC_API_URL ??
            "http://localhost:3003";
          const res = await axios.post(
            `${serverBaseUrl}/api/v1/auth/sign_in`,
            { user: { email: credentials.email, password: credentials.password } },
            { headers: { "Content-Type": "application/json" } }
          );

          const { data } = res.data;
          const token = res.headers["authorization"]?.replace("Bearer ", "");

          if (!token) return null;

          return { ...data, accessToken: token };
        } catch (err) {
          // Log only the status — the axios error object carries `config.data`
          // which contains the submitted email + password. Never log it.
          const status = axios.isAxiosError(err) ? err.response?.status : "unknown";
          console.error("[NextAuth] authorize failed:", status);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { accessToken: string; jlpt_level: string; role: string };
        token.accessToken = u.accessToken;
        token.id = user.id;
        token.jlptLevel = u.jlpt_level;
        token.role = u.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.jlptLevel = token.jlptLevel as string;
      session.user.role = token.role as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day — matches Rails JWT expiry
  },

  secret: process.env.NEXTAUTH_SECRET,
};
