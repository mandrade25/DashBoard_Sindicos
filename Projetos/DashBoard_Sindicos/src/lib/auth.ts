import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "SINDICO";
      condominioId: string | null;
    } & DefaultSession["user"];
  }
}

type AppJWT = {
  id: string;
  role: "ADMIN" | "SINDICO";
  condominioId: string | null;
  [key: string]: unknown;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.senhaHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          condominioId: user.condominioId,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: "ADMIN" | "SINDICO" }).role;
        token.condominioId = (user as { condominioId: string | null }).condominioId;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      if (session.user) {
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.condominioId = t.condominioId;
      }
      return session;
    },
  },
});
