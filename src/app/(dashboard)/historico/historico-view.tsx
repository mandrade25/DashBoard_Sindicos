"use client";

import { Archive, Download, FileSearch, FileText, RotateCcw, Search, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Topbar, type CondominioOption } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface HistoricoItem {
  condominioId: string;
  condominioNome: string;
  competencia: string;
  competenciaLabel: string;
  comprovanteId: string;
  comprovanteIds: string[];
  comprovanteStatus: string;
  observacao: string | null;
  faturamento: string;
  valorRepasse: string;
  percentualRepasse: string;
  dataPagamento: string;
  formaPagamento: string;
  visivelSindico: boolean;
  arquivoNomes: string[];
  ultimoEnvioStatus: string | null;
  ultimoEnvioEm: string | null;
  ultimoEnvioDestinatarios: number;
  confirmadoEm: string | null;
}

const COMPROVANTE_STATUS: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-600" },
  ANEXADO: { label: "Anexado", className: "bg-blue-100 text-blue-700" },
  ENVIADO: { label: "Enviado", className: "bg-green-100 text-green-700" },
  SUBSTITUIDO: { label: "Substituido", className: "bg-yellow-100 text-yellow-700" },
  CANCELADO: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

const ENVIO_STATUS: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-600" },
  AGENDADO: { label: "Agendado", className: "bg-blue-100 text-blue-700" },
  ENVIADO: { label: "Enviado", className: "bg-green-100 text-green-700" },
  REENVIADO: { label: "Reenviado", className: "bg-teal-100 text-teal-700" },
  FALHOU: { label: "Falhou", className: "bg-red-100 text-red-700" },
  ENTREGUE: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
};

const FORMA_LABEL: Record<string, string> = {
  PIX: "PIX",
  TED: "TED",
  DOC: "DOC",
  TRANSFERENCIA_INTERNA: "Transf. Interna",
  OUTRO: "Outro",
};

export function HistoricoView({
  items,
  role,
  condominioNome,
  condominios = [],
  condominioIdSelecionado,
}: {
  items: HistoricoItem[];
  role: string;
  condominioNome?: string | null;
  condominios?: CondominioOption[];
  condominioIdSelecionado?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirmandoKey, setConfirmandoKey] = useState<string | null>(null);
  const [competenciaFiltro, setCompetenciaFiltro] = useState("all");
  const [comprovanteFiltro, setComprovanteFiltro] = useState("all");
  const [envioFiltro, setEnvioFiltro] = useState("all");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAdmin = role === "ADMIN";

  const competencias = useMemo(
    () => Array.from(new Set(items.map((item) => item.competencia))).sort().reverse(),
    [items],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      if (competenciaFiltro !== "all" && item.competencia !== competenciaFiltro) return false;
      if (comprovanteFiltro !== "all" && item.comprovanteStatus !== comprovanteFiltro) return false;
      if (envioFiltro === "com-envio" && !item.ultimoEnvioStatus) return false;
      if (envioFiltro === "sem-envio" && item.ultimoEnvioStatus) return false;
      if (
        envioFiltro !== "all" &&
        envioFiltro !== "com-envio" &&
        envioFiltro !== "sem-envio" &&
        item.ultimoEnvioStatus !== envioFiltro
      ) {
        return false;
      }

      if (!term) return true;

      return [
        item.condominioNome,
        item.competenciaLabel,
        item.competencia,
        item.observacao ?? "",
        item.arquivoNomes.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, competenciaFiltro, comprovanteFiltro, envioFiltro]);

  const metrics = useMemo(() => {
    const competenciasTotal = filteredItems.length;
    const arquivosTotal = filteredItems.reduce((total, item) => total + item.comprovanteIds.length, 0);
    const faturamentoTotal = filteredItems.reduce((total, item) => total + Number(item.faturamento), 0);
    const repasseTotal = filteredItems.reduce((total, item) => total + Number(item.valorRepasse), 0);
    return { competenciasTotal, arquivosTotal, faturamentoTotal, repasseTotal };
  }, [filteredItems]);

  function handleSelecionarCondominio(id: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("condominioId", id);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }

  function handleReenvio(comprovanteId: string) {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch("/api/admin/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprovanteId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; enviados?: string[] };
      if (!res.ok) {
        setMsg(`Erro: ${body.error ?? "Falha no reenvio."}`);
        return;
      }
      setMsg(`Reenvio realizado: ${body.enviados?.length ?? 0} destinatario(s).`);
    });
  }

  function handleExportCsv() {
    const header = [
      "Condominio",
      "Competencia",
      "Faturamento",
      "Repasse",
      "Percentual",
      "Pagamento",
      "Forma",
      "StatusComprovante",
      "StatusUltimoEnvio",
      "ConfirmadoEm",
      "DestinatariosUltimoEnvio",
      "Arquivos",
      "Observacao",
    ];

    const rows = filteredItems.map((item) => [
      item.condominioNome,
      item.competencia,
      Number(item.faturamento).toFixed(2),
      Number(item.valorRepasse).toFixed(2),
      Number(item.percentualRepasse).toFixed(2),
      item.dataPagamento,
      FORMA_LABEL[item.formaPagamento] ?? item.formaPagamento,
      COMPROVANTE_STATUS[item.comprovanteStatus]?.label ?? item.comprovanteStatus,
      item.ultimoEnvioStatus ? ENVIO_STATUS[item.ultimoEnvioStatus]?.label ?? item.ultimoEnvioStatus : "",
      item.confirmadoEm ?? "",
      String(item.ultimoEnvioDestinatarios ?? 0),
      item.arquivoNomes.join(" | "),
      item.observacao ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "central-documentos-minimerx.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  function handleConfirmarRecebimento(item: HistoricoItem) {
    const key = `${item.condominioId}:${item.competencia}`;
    setConfirmandoKey(key);
    setMsg(null);

    startTransition(async () => {
      const response = await fetch("/api/confirmacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condominioId: item.condominioId,
          competencia: item.competencia,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsg(`Erro: ${body.error ?? "Nao foi possivel confirmar o recebimento."}`);
        setConfirmandoKey(null);
        return;
      }

      setMsg(`Recebimento confirmado para ${item.competenciaLabel}.`);
      setConfirmandoKey(null);
      router.refresh();
    });
  }

  return (
    <>
      <Topbar
        role={role as "ADMIN" | "SINDICO"}
        condominioNome={condominioNome ?? "Central de documentos"}
        condominios={!isAdmin && condominios.length > 0 ? condominios : undefined}
        condominioIdSelecionado={condominioIdSelecionado}
        onSelecionarCondominio={!isAdmin ? handleSelecionarCondominio : undefined}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Central de documentos e repasses</h1>
            <p className="mt-1 text-sm text-minimerx-gray">
              {isAdmin
                ? "Visao consolidada dos comprovantes, envios e arquivos por competencia."
                : "Consulte o historico financeiro e documental do condominio selecionado."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportCsv}
              disabled={filteredItems.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Competencias visiveis"
            value={String(metrics.competenciasTotal)}
            sublabel="Resultados apos filtros"
            icon={FileSearch}
          />
          <MetricCard
            label="Arquivos ativos"
            value={String(metrics.arquivosTotal)}
            sublabel="Comprovantes listados"
            icon={Archive}
          />
          <MetricCard
            label="Faturamento consolidado"
            value={formatCurrency(metrics.faturamentoTotal)}
            sublabel="Base do periodo filtrado"
            icon={Wallet}
          />
          <MetricCard
            label="Repasse documentado"
            value={formatCurrency(metrics.repasseTotal)}
            sublabel="Valores com comprovacao"
            tone="accent"
            icon={FileText}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(190px,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-minimerx-gray" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por condominio, competencia, observacao ou nome do arquivo"
                className="pl-9"
              />
            </div>

            <Select value={competenciaFiltro} onValueChange={setCompetenciaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Competencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as competencias</SelectItem>
                {competencias.map((competencia) => {
                  const entry = items.find((item) => item.competencia === competencia);
                  return (
                    <SelectItem key={competencia} value={competencia}>
                      {entry?.competenciaLabel ?? competencia}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={comprovanteFiltro} onValueChange={setComprovanteFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Status do comprovante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os comprovantes</SelectItem>
                {Object.entries(COMPROVANTE_STATUS).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={envioFiltro} onValueChange={setEnvioFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Status do envio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os envios</SelectItem>
                <SelectItem value="com-envio">Com envio registrado</SelectItem>
                <SelectItem value="sem-envio">Sem envio registrado</SelectItem>
                {Object.entries(ENVIO_STATUS).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead className="w-[180px]">Condominio</TableHead>}
                <TableHead className="w-[140px]">Competencia</TableHead>
                <TableHead className="w-[130px]">Faturamento</TableHead>
                <TableHead className="w-[140px]">Valor Repasse</TableHead>
                <TableHead className="w-[120px]">Pagamento</TableHead>
                <TableHead className="w-[90px]">Forma</TableHead>
                <TableHead className="w-[120px]">Comprovante</TableHead>
                <TableHead className="w-[220px]">Arquivos</TableHead>
                <TableHead className="w-[170px]">Ultimo Envio</TableHead>
                <TableHead className="w-[150px]">Confirmacao</TableHead>
                <TableHead className="w-[88px] text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 11 : 10} className="py-16 text-center text-minimerx-gray">
                    Nenhum documento corresponde aos filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const compCfg =
                    COMPROVANTE_STATUS[item.comprovanteStatus] ?? COMPROVANTE_STATUS.PENDENTE;
                  const envioCfg = item.ultimoEnvioStatus
                    ? ENVIO_STATUS[item.ultimoEnvioStatus] ?? ENVIO_STATUS.PENDENTE
                    : null;
                  const canReenviar =
                    isAdmin &&
                    (item.comprovanteStatus === "ENVIADO" || item.comprovanteStatus === "ANEXADO");
                  const canDownload = isAdmin || item.visivelSindico;
                  const zipUrl = `/api/comprovantes/zip?condominioId=${item.condominioId}&competencia=${item.competencia}`;
                  const confirmandoAtual =
                    confirmandoKey === `${item.condominioId}:${item.competencia}` && pending;

                  return (
                    <TableRow key={`${item.condominioId}-${item.competencia}`}>
                      {isAdmin && (
                        <TableCell className="font-medium text-minimerx-navy">
                          <p className="truncate" title={item.condominioNome}>
                            {item.condominioNome}
                          </p>
                        </TableCell>
                      )}

                      <TableCell>
                        <p className="font-medium">{item.competenciaLabel}</p>
                        {item.observacao && (
                          <p
                            className="mt-0.5 line-clamp-2 text-[11px] text-minimerx-gray"
                            title={item.observacao}
                          >
                            {item.observacao}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{formatCurrency(item.faturamento)}</TableCell>

                      <TableCell>
                        <p className="whitespace-nowrap font-medium text-minimerx-navy">
                          {formatCurrency(item.valorRepasse)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-minimerx-gray">
                          {formatPercent(item.percentualRepasse)} aplicado
                        </p>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{formatDate(item.dataPagamento)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {FORMA_LABEL[item.formaPagamento] ?? item.formaPagamento}
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            compCfg.className,
                          )}
                        >
                          {compCfg.label}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs text-minimerx-gray">
                            <FileText className="h-3.5 w-3.5" />
                            {item.comprovanteIds.length}
                          </span>
                          <div className="space-y-0.5">
                            {item.arquivoNomes.slice(0, 2).map((arquivo) => (
                              <p
                                key={arquivo}
                                className="truncate text-[11px] text-minimerx-gray"
                                title={arquivo}
                              >
                                {arquivo}
                              </p>
                            ))}
                            {item.arquivoNomes.length > 2 && (
                              <p className="text-[11px] text-minimerx-gray">
                                +{item.arquivoNomes.length - 2} arquivo(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {envioCfg ? (
                          <div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                envioCfg.className,
                              )}
                            >
                              {envioCfg.label}
                            </span>
                            {item.ultimoEnvioEm && (
                              <p className="mt-0.5 text-[11px] leading-5 text-minimerx-gray">
                                {formatDateTime(item.ultimoEnvioEm)}
                                <br />
                                {item.ultimoEnvioDestinatarios} destinatario(s)
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-minimerx-gray">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.confirmadoEm ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Confirmado
                            </span>
                            <p className="mt-0.5 text-[11px] leading-5 text-minimerx-gray">
                              {formatDateTime(item.confirmadoEm)}
                            </p>
                          </div>
                        ) : item.ultimoEnvioStatus ? (
                          <span className="text-xs text-amber-700">Aguardando confirmacao</span>
                        ) : (
                          <span className="text-xs text-minimerx-gray">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!isAdmin && item.ultimoEnvioStatus && !item.confirmadoEm && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmarRecebimento(item)}
                              disabled={confirmandoAtual}
                            >
                              {confirmandoAtual ? "Confirmando..." : "Confirmar"}
                            </Button>
                          )}
                          {canDownload && (
                            <Button variant="ghost" size="sm" asChild title="Baixar todos os arquivos (.zip)">
                              <a href={zipUrl} download>
                                <Archive className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {canReenviar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReenvio(item.comprovanteId)}
                              disabled={pending}
                              title="Reenviar e-mail"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
