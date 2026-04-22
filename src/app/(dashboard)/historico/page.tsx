import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HistoricoView } from "./historico-view";
import { competenciaLabel, nextMonthStart, toCompetencia } from "@/lib/competencia";

export const metadata = { title: "Histórico — MiniMerX" };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams?: { condominioId?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSindico = session.user.role === "SINDICO";
  const sindicoCondominioIds = Array.from(
    new Set([
      ...(session.user.condominioIds ?? []),
      ...(session.user.condominioId ? [session.user.condominioId] : []),
    ]),
  );
  const condominios =
    isSindico
      ? await prisma.condominio.findMany({
          where: { id: { in: sindicoCondominioIds } },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : [];

  const selectedCondominioId =
    isSindico && condominios.length > 0
      ? condominios.some((item) => item.id === searchParams?.condominioId)
        ? searchParams?.condominioId ?? null
        : session.user.condominioId ?? condominios[0]?.id ?? null
      : null;

  if (isSindico && !selectedCondominioId) redirect("/dashboard");

  const condominioNome =
    isSindico && selectedCondominioId
      ? condominios.find((item) => item.id === selectedCondominioId)?.nome ?? null
      : null;

  const comprovantes = await prisma.comprovante.findMany({
    where: {
      ...(isSindico
        ? { condominioId: selectedCondominioId!, status: { not: "CANCELADO" } }
        : {}),
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
    take: 500,
  });

  const groupMap = new Map<string, typeof comprovantes>();
  for (const comp of comprovantes) {
    if (comp.status === "CANCELADO") continue;
    const key = `${comp.condominioId}:${comp.competencia}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(comp);
  }

  const competencias = Array.from(groupMap.values()).map((group) => group[0].competencia);
  const condominioIds = Array.from(new Set(Array.from(groupMap.values()).map((group) => group[0].condominioId)));
  const competenciasOrdenadas = [...competencias].sort();
  const competenciaInicial = competenciasOrdenadas[0] ?? null;
  const competenciaFinal = competenciasOrdenadas[competenciasOrdenadas.length - 1] ?? null;
  const faturamentoMap = new Map<string, number>();

  if (competenciaInicial && competenciaFinal && condominioIds.length > 0) {
    const [anoInicial, mesInicial] = competenciaInicial.split("-").map(Number);
    const vendas = await prisma.venda.findMany({
      where: {
        condominioId: { in: condominioIds },
        data: {
          gte: new Date(anoInicial, mesInicial - 1, 1),
          lt: nextMonthStart(competenciaFinal),
        },
      },
      select: {
        condominioId: true,
        data: true,
        valorVenda: true,
      },
    });

    for (const venda of vendas) {
      const key = `${venda.condominioId}:${toCompetencia(new Date(venda.data))}`;
      faturamentoMap.set(key, (faturamentoMap.get(key) ?? 0) + Number(venda.valorVenda));
    }
  }

  const items = [];
  const confirmacoes = await prisma.auditLog.findMany({
    where: {
      tipo: "COMPETENCIA_CONFIRMADA",
      entidade: "Competencia",
      ...(condominioIds.length > 0
        ? {
            OR: condominioIds.map((id) => ({
              payload: {
                path: ["condominioId"],
                equals: id,
              },
            })),
          }
        : {}),
    },
    orderBy: { criadoEm: "desc" },
  });
  const confirmacaoMap = new Map<string, string>();
  for (const item of confirmacoes) {
    if (!confirmacaoMap.has(item.entidadeId)) {
      confirmacaoMap.set(item.entidadeId, item.criadoEm.toISOString());
    }
  }

  for (const group of groupMap.values()) {
    const hasVisivel = group.some((c) => c.visivelSindico);
    if (isSindico && !hasVisivel) continue;

    const primary = group[0];
    const ultimoEnvio =
      group
        .flatMap((c) => c.envios)
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0] ??
      null;

    items.push({
      condominioId: primary.condominioId,
      condominioNome: primary.condominio.nome,
      competencia: primary.competencia,
      competenciaLabel: competenciaLabel(primary.competencia),
      comprovanteId: primary.id,
      comprovanteIds: group.map((c) => c.id),
      comprovanteStatus: primary.status,
      observacao: primary.observacao ?? null,
      faturamento: String(faturamentoMap.get(`${primary.condominioId}:${primary.competencia}`) ?? 0),
      valorRepasse: primary.valorRepasse.toString(),
      percentualRepasse: primary.condominio.percentualRepasse.toString(),
      dataPagamento: primary.dataPagamento.toISOString().substring(0, 10),
      formaPagamento: primary.formaPagamento,
      visivelSindico: hasVisivel,
      arquivoNomes: group.map((c) => c.nomeArquivo),
      ultimoEnvioStatus: ultimoEnvio?.status ?? null,
      ultimoEnvioEm: ultimoEnvio?.enviadoEm?.toISOString() ?? null,
      ultimoEnvioDestinatarios: ultimoEnvio?.destinatarios.length ?? 0,
      confirmadoEm: confirmacaoMap.get(`${primary.condominioId}:${primary.competencia}`) ?? null,
    });
  }

  return (
    <HistoricoView
      items={items}
      role={session.user.role}
      condominioNome={condominioNome}
      condominios={condominios}
      condominioIdSelecionado={selectedCondominioId}
    />
  );
}
