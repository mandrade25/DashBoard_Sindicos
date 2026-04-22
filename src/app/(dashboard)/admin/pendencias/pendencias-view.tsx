"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, FileText, Send } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Pendencia {
  tipo: "SEM_COMPROVANTE" | "NAO_ENVIADO";
  condominioId: string;
  condominioNome: string;
  competencia: string;
  competenciaLabel: string;
}

const TIPO_CONFIG = {
  SEM_COMPROVANTE: {
    label: "Sem comprovante",
    className: "bg-red-100 text-red-700",
    icon: AlertTriangle,
    descricao: "Nenhum comprovante anexado para esta competência.",
    acao: "Anexar comprovante",
  },
  NAO_ENVIADO: {
    label: "Não enviado",
    className: "bg-yellow-100 text-yellow-700",
    icon: Send,
    descricao: "Comprovante anexado mas e-mail não enviado ao síndico.",
    acao: "Enviar e-mail",
  },
};

export function PendenciasView({ pendencias }: { pendencias: Pendencia[] }) {
  const semComprovante = pendencias.filter((p) => p.tipo === "SEM_COMPROVANTE").length;
  const naoEnviado = pendencias.filter((p) => p.tipo === "NAO_ENVIADO").length;

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Pendências Operacionais" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-minimerx-navy">Pendências Operacionais</h1>
          <p className="mt-1 text-sm text-minimerx-gray">
            Condomínios com comprovante ou envio em aberto nos últimos 3 meses de competência.
          </p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-minimerx-gray">Total de pendências</p>
            <p className="mt-1 text-3xl font-bold text-minimerx-navy">{pendencias.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-minimerx-gray">Sem comprovante</p>
            <p className="mt-1 text-3xl font-bold text-red-600">{semComprovante}</p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-minimerx-gray">Comprovante não enviado</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">{naoEnviado}</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-xl border bg-white">
          {pendencias.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CheckCircle className="h-10 w-10 text-minimerx-green" />
              <p className="text-lg font-semibold text-minimerx-navy">Tudo em dia!</p>
              <p className="text-sm text-minimerx-gray">Nenhuma pendência nos últimos 3 meses.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendencias.map((p, i) => {
                  const config = TIPO_CONFIG[p.tipo];
                  const Icon = config.icon;
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-minimerx-navy">{p.condominioNome}</TableCell>
                      <TableCell>{p.competenciaLabel}</TableCell>
                      <TableCell>
                        <Badge className={config.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-minimerx-gray">{config.descricao}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/comprovantes?condominioId=${p.condominioId}&competencia=${p.competencia}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            {config.acao}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </>
  );
}
