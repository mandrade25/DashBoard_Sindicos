import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competenciaLabel, competenciasRange } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const condominioIdParam = searchParams.get("condominioId");

  // SINDICO só pode ver o próprio condomínio
  const condominioId =
    session.user.role === "SINDICO"
      ? (session.user.condominioId ?? undefined)
      : (condominioIdParam ?? undefined);

  if (session.user.role === "SINDICO" && !condominioId) {
    return NextResponse.json({ error: "Síndico sem condomínio." }, { status: 422 });
  }

  // Buscar comprovantes com seus envios
  const comprovantes = await prisma.comprovante.findMany({
    where: {
      ...(condominioId ? { condominioId } : {}),
      // SINDICO só vê comprovantes marcados como visível
      ...(session.user.role === "SINDICO" ? { visivelSindico: true } : {}),
    },
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
    include: {
      condominio: { select: { id: true, nome: true, percentualRepasse: true } },
      envios: {
        orderBy: { criadoEm: "desc" },
        take: 1,
        include: { destinatarios: true },
      },
    },
  });

  // Agrupar por (condominioId, competencia) — pegar o mais recente de cada grupo
  const seen = new Set<string>();
  const result = [];

  for (const comp of comprovantes) {
    const key = `${comp.condominioId}:${comp.competencia}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ultimoEnvio = comp.envios[0] ?? null;
    result.push({
      condominioId: comp.condominioId,
      condominioNome: comp.condominio.nome,
      competencia: comp.competencia,
      competenciaLabel: competenciaLabel(comp.competencia),
      comprovanteId: comp.id,
      comprovanteStatus: comp.status,
      valorRepasse: comp.valorRepasse.toString(),
      dataPagamento: comp.dataPagamento.toISOString().substring(0, 10),
      formaPagamento: comp.formaPagamento,
      visivelSindico: comp.visivelSindico,
      ultimoEnvioStatus: ultimoEnvio?.status ?? null,
      ultimoEnvioEm: ultimoEnvio?.enviadoEm?.toISOString() ?? null,
    });
  }

  return NextResponse.json(result);
}
