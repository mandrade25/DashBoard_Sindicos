import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveSelectedCondominioId } from "@/lib/condominio-access";
import { prisma } from "@/lib/prisma";
import { competenciaLabel } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const condominioIdParam = searchParams.get("condominioId");
  const condominioId = resolveSelectedCondominioId({
    user: session.user,
    requestedCondominioId: condominioIdParam,
  });

  if (session.user.role === "SINDICO" && !condominioId) {
    return NextResponse.json({ error: "Sindico sem condominio." }, { status: 422 });
  }

  const comprovantes = await prisma.comprovante.findMany({
    where: {
      ...(condominioId ? { condominioId } : {}),
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
