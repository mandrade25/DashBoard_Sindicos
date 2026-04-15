import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role;

  const condominios =
    role === "ADMIN"
      ? await prisma.condominio.findMany({
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : [];

  return (
    <DashboardView
      role={role}
      condominioIdInicial={role === "SINDICO" ? session!.user.condominioId : condominios[0]?.id ?? null}
      condominios={condominios}
    />
  );
}
