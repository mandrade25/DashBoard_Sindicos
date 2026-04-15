import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutShell } from "@/components/LayoutShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const condominioNome =
    role === "SINDICO" && session.user.condominioId
      ? (
          await prisma.condominio.findUnique({
            where: { id: session.user.condominioId },
            select: { nome: true },
          })
        )?.nome ?? null
      : null;

  return (
    <LayoutShell
      role={role}
      usuarioNome={session.user.name ?? "Usuário"}
      condominioNome={condominioNome}
    >
      {children}
    </LayoutShell>
  );
}
