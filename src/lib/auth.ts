import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function isGitHubConfigured(): boolean {
  return Boolean(
    process.env.AUTH_GITHUB_ID?.trim() &&
      process.env.AUTH_GITHUB_SECRET?.trim(),
  );
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
      name: "邮箱密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          image: user.image,
        };
      },
    }),
];

if (isGitHubConfigured()) {
  providers.unshift(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
