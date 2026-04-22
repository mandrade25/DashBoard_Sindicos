import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competenciaLabel, toCompetencia } from "@/lib/competencia";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Competências dos últimos 3 meses que deveriam ter comprovante
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
    where: {
      competencia: { in: competencias },
      status: { in: ["ANEXADO", "ENVIADO"] },
    },
    select: { condominioId: true, competencia: true, status: true },
  });

  const existentesSet = new Set(
    comprovantesExistentes.map((c) => `${c.condominioId}:${c.competencia}`),
  );
  const enviadosSet = new Set(
    comprovantesExistentes
      .filter((c) => c.status === "ENVIADO")
      .map((c) => `${c.condominioId}:${c.competencia}`),
  );

  const pendencias = [];
  for (const cond of condominios) {
    const inicioOperacao = toCompetencia(cond.dataInicio);
    for (const comp of competencias) {
      if (comp < inicioOperacao) continue;
      const key = `${cond.id}:${comp}`;
      if (!existentesSet.has(key)) {
        pendencias.push({
          tipo: "SEM_COMPROVANTE" as const,
          condominioId: cond.id,
          condominioNome: cond.nome,
          competencia: comp,
          competenciaLabel: competenciaLabel(comp),
        });
      } else if (!enviadosSet.has(key)) {
        pendencias.push({
          tipo: "NAO_ENVIADO" as const,
          condominioId: cond.id,
          condominioNome: cond.nome,
          competencia: comp,
          competenciaLabel: competenciaLabel(comp),
        });
      }
    }
  }

  return NextResponse.json({ total: pendencias.length, pendencias });
}
