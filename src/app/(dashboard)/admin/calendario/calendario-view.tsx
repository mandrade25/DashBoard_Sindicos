"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters";

interface CompetenciaHeader {
  value: string;
  label: string;
}

interface CalendarioCell {
  competencia: string;
  competenciaLabel: string;
  status: string;
  statusLabel: string;
  destaque: boolean;
  confirmadoEm: string | null;
}

interface CalendarioRow {
  condominioId: string;
  condominioNome: string;
  competencias: CalendarioCell[];
}

function getStatusClass(status: string) {
  switch (status) {
    case "REGULARIZADA":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "COMUNICADA":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "COMPROVANTE_ANEXADO":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "FECHADA_SEM_COMPROVANTE":
      return "bg-red-100 text-red-700 border-red-200";
    case "EM_ABERTO":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-400 border-slate-200";
  }
}

export function CalendarioView({
  competencias,
  rows,
}: {
  competencias: CompetenciaHeader[];
  rows: CalendarioRow[];
}) {
  const desvios = rows.reduce(
    (total, row) => total + row.competencias.filter((cell) => cell.destaque).length,
    0,
  );

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Calendario de fechamento" />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Calendario de fechamento</h1>
            <p className="mt-1 text-sm text-minimerx-gray">
              Leitura mensal do ciclo por condominio, com destaque para desvios e confirmacoes.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/comprovantes">Abrir comprovantes</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Condominios monitorados
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-navy">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Competencias avaliadas
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-blue">
              {competencias.length * rows.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Desvios destacados
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">{desvios}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[280px_repeat(6,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                Condominio
              </div>
              {competencias.map((competencia) => (
                <div
                  key={competencia.value}
                  className="border-l border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-minimerx-gray"
                >
                  {competencia.label}
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <div
                key={row.condominioId}
                className="grid grid-cols-[280px_repeat(6,minmax(0,1fr))] border-b border-slate-200 last:border-b-0"
              >
                <div className="px-4 py-4">
                  <p className="font-semibold text-minimerx-navy">{row.condominioNome}</p>
                  <p className="mt-1 text-xs text-minimerx-gray">
                    Clique em comprovantes para agir na competencia desejada.
                  </p>
                </div>

                {row.competencias.map((cell) => (
                  <div key={cell.competencia} className="border-l border-slate-200 px-3 py-4">
                    <div className={`rounded-xl border px-3 py-3 ${getStatusClass(cell.status)}`}>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {cell.statusLabel}
                          </p>
                          {cell.confirmadoEm ? (
                            <p className="mt-1 text-[11px] leading-5">
                              Confirmado em {formatDateTime(cell.confirmadoEm)}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] leading-5">
                              {cell.status === "COMUNICADA"
                                ? "Aguardando retorno do condominio"
                                : cell.status === "FECHADA_SEM_COMPROVANTE"
                                  ? "Acao operacional pendente"
                                  : cell.status === "COMPROVANTE_ANEXADO"
                                    ? "Enviar comunicacao para concluir o ciclo"
                                    : cell.status === "EM_ABERTO"
                                      ? "Competencia em andamento"
                                      : "Sem acao imediata"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
