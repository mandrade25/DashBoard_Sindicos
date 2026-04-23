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
                condominioIds: string[];
        } & DefaultSession["user"];
  }
}

type AppJWT = {
  id: string;
  role: "ADMIN" | "SINDICO";
  condominioId: string | null;
  [key: string]: unknown;
};

type AuthUserRecord = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  role: "ADMIN" | "SINDICO";
  condominioId: string | null;
  acessos: Array<{ condominioId: string }>;
};

type AuthLookup =
  | { id: string; email?: never }
  | { email: string; id?: never };

function mergeCondominioIds(
  condominioIds: string[] | null | undefined,
  condominioId: string | null | undefined,
) {
  return Array.from(
    new Set([...(condominioIds ?? []), ...(condominioId ? [condominioId] : [])]),
  );
}

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

function looksLikeLegacyAccessSchemaError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("usuariocondominio") ||
    message.includes("acessos") ||
    message.includes("relation") ||
    message.includes("table") ||
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("unknown field")
  );
}

async function findUserForAuth(where: AuthLookup) {
  try {
    return await prisma.usuario.findUnique({
      where,
      include: {
        acessos: {
          select: { condominioId: true },
          orderBy: { criadoEm: "asc" },
        },
      },
    });
  } catch (error) {
    if (!looksLikeLegacyAccessSchemaError(error)) {
      throw error;
    }

    const legacyUser = await prisma.usuario.findUnique({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        senhaHash: true,
        role: true,
        condominioId: true,
      },
    });

    if (!legacyUser) return null;

    console.warn(
      "[auth] Falling back to legacy user lookup because UsuarioCondominio is unavailable.",
    );

    return {
      ...legacyUser,
      acessos: [],
    } satisfies AuthUserRecord;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 30,
    updateAge: 60 * 5,
  },
  jwt: {
    maxAge: 60 * 30,
  },
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
        const user = await findUserForAuth({ email });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.senhaHash);
        if (!ok) return null;

        const condominioIds = mergeCondominioIds(
          user.acessos.map((acesso) => acesso.condominioId),
          user.condominioId,
        );
        const condominioId = user.condominioId ?? condominioIds[0] ?? null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          condominioId,
          condominioIds,
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
      } else {
        token.condominioId =
          typeof token.condominioId === "string" ? token.condominioId : null;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      if (session.user) {
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.condominioId = t.condominioId;

        if (t.role === "SINDICO" && t.id) {
          const dbUser = await findUserForAuth({ id: String(t.id) });

          if (dbUser) {
            const condominioIds = mergeCondominioIds(
              dbUser.acessos.map((acesso) => acesso.condominioId),
              dbUser.condominioId,
            );

            session.user.name = dbUser.nome;
            session.user.role = dbUser.role;
            session.user.condominioId = dbUser.condominioId ?? condominioIds[0] ?? null;
            session.user.condominioIds = condominioIds;
          } else {
            session.user.condominioId = null;
            session.user.condominioIds = [];
          }
        } else {
          session.user.condominioIds = [];
        }
      }
      return session;
    },
  },
});
