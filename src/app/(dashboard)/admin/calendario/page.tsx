import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competenciaLabel, toCompetencia } from "@/lib/competencia";
import { CalendarioView } from "./calendario-view";

function buildCompetencias(monthsBack = 6) {
  const now = new Date();
  return Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return toCompetencia(date);
  }).reverse();
}

export default async function CalendarioPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const competencias = buildCompetencias(6);
  const currentCompetencia = toCompetencia(new Date());

  const [condominios, comprovantes, confirmacoes] = await Promise.all([
    prisma.condominio.findMany({
      select: { id: true, nome: true, dataInicio: true },
      orderBy: { nome: "asc" },
    }),
    prisma.comprovante.findMany({
      where: {
        competencia: { in: competencias },
        status: { not: "CANCELADO" },
      },
      include: {
        envios: {
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        tipo: "COMPETENCIA_CONFIRMADA",
        entidade: "Competencia",
      },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const comprovanteMap = new Map<string, (typeof comprovantes)[number]>();
  for (const item of comprovantes) {
    const key = `${item.condominioId}:${item.competencia}`;
    if (!comprovanteMap.has(key)) {
      comprovanteMap.set(key, item);
    }
  }

  const confirmacaoMap = new Map<string, string>();
  for (const item of confirmacoes) {
    if (!confirmacaoMap.has(item.entidadeId)) {
      confirmacaoMap.set(item.entidadeId, item.criadoEm.toISOString());
    }
  }

  const rows = condominios.map((condominio) => {
    const inicioOperacao = toCompetencia(condominio.dataInicio);
    const competenciasItems = competencias.map((competencia) => {
      if (competencia < inicioOperacao) {
        return {
          competencia,
          competenciaLabel: competenciaLabel(competencia),
          status: "FORA_DE_OPERACAO",
          statusLabel: "Fora de operacao",
          destaque: false,
          confirmadoEm: null,
        };
      }

      const key = `${condominio.id}:${competencia}`;
      const comprovante = comprovanteMap.get(key);
      const confirmacao = confirmacaoMap.get(key) ?? null;
      const ultimoEnvio = comprovante?.envios[0] ?? null;

      if (competencia === currentCompetencia) {
        return {
          competencia,
          competenciaLabel: competenciaLabel(competencia),
          status: "EM_ABERTO",
          statusLabel: "Em aberto",
          destaque: false,
          confirmadoEm: confirmacao,
        };
      }

      if (!comprovante) {
        return {
          competencia,
          competenciaLabel: competenciaLabel(competencia),
          status: "FECHADA_SEM_COMPROVANTE",
          statusLabel: "Sem comprovante",
          destaque: true,
          confirmadoEm: confirmacao,
        };
      }

      if (confirmacao) {
        return {
          competencia,
          competenciaLabel: competenciaLabel(competencia),
          status: "REGULARIZADA",
          statusLabel: "Regularizada",
          destaque: false,
          confirmadoEm: confirmacao,
        };
      }

      if (ultimoEnvio) {
        return {
          competencia,
          competenciaLabel: competenciaLabel(competencia),
          status: "COMUNICADA",
          statusLabel: "Comunicada",
          destaque: true,
          confirmadoEm: null,
        };
      }

      return {
        competencia,
        competenciaLabel: competenciaLabel(competencia),
        status: "COMPROVANTE_ANEXADO",
        statusLabel: "Comprovante anexado",
        destaque: true,
        confirmadoEm: null,
      };
    });

    return {
      condominioId: condominio.id,
      condominioNome: condominio.nome,
      competencias: competenciasItems,
    };
  });

  return (
    <CalendarioView
      competencias={competencias.map((competencia) => ({
        value: competencia,
        label: competenciaLabel(competencia),
      }))}
      rows={rows}
    />
  );
}
