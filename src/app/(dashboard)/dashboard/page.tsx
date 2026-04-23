import { auth } from "@/lib/auth";
import {
  getAccessibleCondominioIds,
  resolveSelectedCondominioId,
} from "@/lib/condominio-access";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role;
  const sindicoCondominioIds = getAccessibleCondominioIds(session!.user);

  const condominios =
    role === "ADMIN"
      ? await prisma.condominio.findMany({
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : await prisma.condominio.findMany({
          where: { id: { in: sindicoCondominioIds } },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        });

  return (
    <DashboardView
      role={role}
      condominioIdInicial={resolveSelectedCondominioId({
        user: session!.user,
        fallbackCondominioIds: condominios.map((item) => item.id),
      })}
      condominios={condominios}
    />
  );
}
