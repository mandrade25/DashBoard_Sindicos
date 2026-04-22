import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { competenciaLabel, toCompetencia } from "@/lib/competencia";
import { PendenciasView } from "./pendencias-view";

export default async function PendenciasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const competencias: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    competencias.push(toCompetencia(d));
  }

  const condominios = await prisma.condominio.findMany({
    select: { id: true, nome: true, dataInicio: true },
    orderBy: { nome: "asc" },
  });

  const comprovantesExistentes = await prisma.comprovante.findMany({
    where: { competencia: { in: competencias }, status: { in: ["ANEXADO", "ENVIADO"] } },
    select: { condominioId: true, competencia: true, status: true },
  });

  const existentesSet = new Set(comprovantesExistentes.map((c) => `${c.condominioId}:${c.competencia}`));
  const enviadosSet = new Set(
    comprovantesExistentes.filter((c) => c.status === "ENVIADO").map((c) => `${c.condominioId}:${c.competencia}`),
  );

  const pendencias: Array<{ tipo: "SEM_COMPROVANTE" | "NAO_ENVIADO"; condominioId: string; condominioNome: string; competencia: string; competenciaLabel: string }> = [];

  for (const cond of condominios) {
    const inicioOperacao = toCompetencia(cond.dataInicio);
    for (const comp of competencias) {
      if (comp < inicioOperacao) continue;
      const key = `${cond.id}:${comp}`;
      if (!existentesSet.has(key)) {
        pendencias.push({ tipo: "SEM_COMPROVANTE", condominioId: cond.id, condominioNome: cond.nome, competencia: comp, competenciaLabel: competenciaLabel(comp) });
      } else if (!enviadosSet.has(key)) {
        pendencias.push({ tipo: "NAO_ENVIADO", condominioId: cond.id, condominioNome: cond.nome, competencia: comp, competenciaLabel: competenciaLabel(comp) });
      }
    }
  }

  return <PendenciasView pendencias={pendencias} />;
}
