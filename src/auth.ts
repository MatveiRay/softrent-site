import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * NextAuth.js v5 (Auth.js) config.
 *
 * For demo/academic use this accepts any non-empty email + password ≥ 4 chars,
 * and synthesises a user object from the email's local-part. Hook in a real
 * database (Prisma adapter) when Phase 2 lands.
 *
 * Google OAuth is wired but disabled — set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
 * in .env.local + add the provider below to enable.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        const providedName = (credentials?.name as string | undefined)?.trim();
        if (!email || !password || password.length < 4) return null;

        const local = email.split("@")[0] ?? "Гость";
        const fallbackName = local.charAt(0).toUpperCase() + local.slice(1);
        return {
          id: email,
          email,
          name: providedName && providedName.length > 0 ? providedName : fallbackName,
        };
      },
    }),
  ],
  pages: {
    signIn: "/", // sign-in is handled via the LoginModal on the home page
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  trustHost: true,
});
