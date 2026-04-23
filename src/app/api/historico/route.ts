import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertAcessoCondominio } from "@/lib/dashboard-queries";
import { prisma } from "@/lib/prisma";
import { competenciaLabel } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const condominioIdParam = searchParams.get("condominioId");
  const requestedCondominioId =
    condominioIdParam ??
    (session.user.role === "SINDICO" ? session.user.condominioId ?? undefined : undefined);

  if (session.user.role === "SINDICO" && !requestedCondominioId) {
    return NextResponse.json({ error: "Sindico sem condominio." }, { status: 422 });
  }

  if (requestedCondominioId) {
    const autorizado = await assertAcessoCondominio(
      session.user.role,
      session.user.condominioIds ?? [],
      requestedCondominioId,
    );
    if (!autorizado) {
      return NextResponse.json({ error: "Proibido." }, { status: 403 });
    }

    const condominio = await prisma.condominio.findUnique({
      where: { id: requestedCondominioId },
      select: { id: true },
    });
    if (!condominio) {
      return NextResponse.json({ error: "Condominio nao encontrado." }, { status: 404 });
    }
  }

  const comprovantes = await prisma.comprovante.findMany({
    where: {
      ...(requestedCondominioId ? { condominioId: requestedCondominioId } : {}),
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
