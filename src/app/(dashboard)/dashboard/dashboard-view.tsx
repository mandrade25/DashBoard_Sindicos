"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Calendar, FileText, RefreshCw, Send, TrendingUp, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { SalesChart, type Period } from "@/components/SalesChart";
import { SalesTable, type SalesRow } from "@/components/SalesTable";
import { Topbar, type CondominioOption } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/formatters";

const LS_KEY = "minimerx_condominioId";

interface Resumo {
  hoje: number;
  semana: number;
  mes: number;
  ano: number;
  repasseMes: number;
  repasseAno: number;
  percentualRepasse: number;
}

interface VendasPayload {
  chart: Array<{ date: string; value: number }>;
  table: SalesRow[];
}

interface HistoricoResumoItem {
  competencia: string;
  competenciaLabel: string;
  comprovanteStatus: string;
  valorRepasse: string;
  ultimoEnvioStatus: string | null;
  ultimoEnvioEm: string | null;
}

interface DashboardViewProps {
  role: "ADMIN" | "SINDICO";
  condominioIdInicial: string | null;
  condominios: CondominioOption[];
}

export function DashboardView({ role, condominioIdInicial, condominios }: DashboardViewProps) {
  const [condominioId, setCondominioId] = useState<string | null>(condominioIdInicial);
  const [period, setPeriod] = useState<Period>("month");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [vendas, setVendas] = useState<VendasPayload | null>(null);
  const [historicoResumo, setHistoricoResumo] = useState<HistoricoResumoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return;

    const savedExists = condominios.some((condominio) => condominio.id === saved);
    if (savedExists) {
      setCondominioId(saved);
      return;
    }

    localStorage.removeItem(LS_KEY);
  }, [condominios]);

  function handleSelecionarCondominio(id: string) {
    setCondominioId(id);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  }

  function loadData(cId: string, p: Period) {
    setLoading(true);
    setError(false);
    let cancel = false;

    Promise.all([
      fetch(`/api/dashboard/resumo?condominioId=${cId}`).then((r) => {
        if (!r.ok) throw new Error("resumo");
        return r.json();
      }),
      fetch(`/api/dashboard/vendas?condominioId=${cId}&period=${p}`).then((r) => {
        if (!r.ok) throw new Error("vendas");
        return r.json();
      }),
      fetch(`/api/historico?condominioId=${cId}`).then((r) => {
        if (!r.ok) throw new Error("historico");
        return r.json();
      }),
    ])
      .then(([r, v, h]) => {
        if (cancel) return;
        setResumo(r);
        setVendas(v);
        setHistoricoResumo(Array.isArray(h) ? h : []);
      })
      .catch(() => {
        if (!cancel) setError(true);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }

  useEffect(() => {
    if (!condominioId) {
      setLoading(false);
      return;
    }

    const condominioExiste = condominios.some((condominio) => condominio.id === condominioId);
    if (!condominioExiste) {
      setLoading(false);
      setError(false);
      return;
    }

    return loadData(condominioId, period);
  }, [condominioId, condominios, period]);

  useEffect(() => {
    if (condominioId && condominios.length > 0) {
      const existe = condominios.some((c) => c.id === condominioId);
      if (!existe) {
        const primeiro = condominios[0]?.id ?? null;
        setCondominioId(primeiro);
        if (primeiro) localStorage.setItem(LS_KEY, primeiro);
        else localStorage.removeItem(LS_KEY);
      }
    }
  }, [condominios, condominioId]);

  const pct = resumo?.percentualRepasse ?? 0;
  const ultimaCompetencia = historicoResumo[0] ?? null;
  const repasseChart =
    vendas?.chart.map((d) => ({
      date: d.date,
      value: pct > 0 ? (d.value * pct) / 100 : 0,
    })) ?? [];

  return (
    <>
      <Topbar
        role={role}
        condominioNome={condominios.find((c) => c.id === condominioId)?.nome ?? "Seu condominio"}
        condominioIdSelecionado={condominioId ?? undefined}
        onSelecionarCondominio={handleSelecionarCondominio}
        condominios={condominios}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {!condominioId ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-minimerx-navy">
              Nenhum condominio cadastrado ainda
            </p>
            <p className="mt-2 text-sm text-minimerx-gray">
              Cadastre um condominio em &quot;Condominios&quot; para comecar a visualizar vendas.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div>
              <p className="text-lg font-semibold text-red-700">Erro ao carregar dados</p>
              <p className="mt-1 text-sm text-red-500">
                Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => loadData(condominioId, period)}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Vendas de hoje"
                value={formatCurrency(resumo?.hoje ?? 0)}
                icon={TrendingUp}
                loading={loading}
              />
              <MetricCard
                label="Semana atual"
                value={formatCurrency(resumo?.semana ?? 0)}
                icon={Calendar}
                loading={loading}
              />
              <MetricCard
                label="Mes atual"
                value={formatCurrency(resumo?.mes ?? 0)}
                icon={Calendar}
                loading={loading}
              />
              <MetricCard
                label="Ano atual"
                value={formatCurrency(resumo?.ano ?? 0)}
                icon={Calendar}
                loading={loading}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                label="Repasse do mes"
                value={formatCurrency(resumo?.repasseMes ?? 0)}
                sublabel="Percentual contratado"
                badge={resumo ? formatPercent(resumo.percentualRepasse) : undefined}
                icon={Wallet}
                tone="accent"
                loading={loading}
              />
              <MetricCard
                label="Repasse do ano"
                value={formatCurrency(resumo?.repasseAno ?? 0)}
                sublabel="Percentual contratado"
                badge={resumo ? formatPercent(resumo.percentualRepasse) : undefined}
                icon={Wallet}
                tone="accent"
                loading={loading}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-minimerx-navy">Graficos por periodo</h2>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mes</TabsTrigger>
                  <TabsTrigger value="year">Ano</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SalesChart
                data={vendas?.chart ?? []}
                period={period}
                loading={loading}
                title="Vendas"
                barLabel="Vendas"
                color="#3DAE3C"
              />
              <SalesChart
                data={repasseChart}
                period={period}
                loading={loading}
                title="Repasse"
                barLabel="Repasse"
                color="#2E8BC0"
              />
            </div>

            <div className="mt-6 mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Painel executivo
                </p>
                <h2 className="mt-2 text-2xl font-bold text-minimerx-navy">
                  Sua parceria em um relance
                </h2>
                <p className="mt-2 text-sm leading-6 text-minimerx-gray">
                  Consulte o fechamento mais recente, acompanhe a ultima comunicacao e acesse
                  rapidamente os documentos e notificacoes do condominio.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/historico">Abrir central documental</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/notificacoes">Ver notificacoes</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <FileText className="h-5 w-5 text-minimerx-blue" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Ultima competencia
                    </p>
                    <p className="text-sm font-semibold text-minimerx-navy">
                      {ultimaCompetencia?.competenciaLabel ?? "Ainda sem fechamento"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-minimerx-gray">
                  <p>
                    Status do comprovante:{" "}
                    <span className="font-medium text-minimerx-navy">
                      {ultimaCompetencia?.comprovanteStatus ?? "Sem registro"}
                    </span>
                  </p>
                  <p>
                    Repasse documentado:{" "}
                    <span className="font-medium text-minimerx-navy">
                      {ultimaCompetencia ? formatCurrency(ultimaCompetencia.valorRepasse) : "R$ 0,00"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <Send className="h-5 w-5 text-minimerx-green" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Comunicacao mais recente
                    </p>
                    <p className="text-sm font-semibold text-minimerx-navy">
                      {ultimaCompetencia?.ultimoEnvioStatus ?? "Sem envio registrado"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-minimerx-gray">
                  <p>
                    Competencia:{" "}
                    <span className="font-medium text-minimerx-navy">
                      {ultimaCompetencia?.competenciaLabel ?? "-"}
                    </span>
                  </p>
                  <p>
                    Data do ultimo envio:{" "}
                    <span className="font-medium text-minimerx-navy">
                      {ultimaCompetencia?.ultimoEnvioEm
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(ultimaCompetencia.ultimoEnvioEm))
                        : "-"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-minimerx-navy">Historico detalhado</h2>
              <SalesTable rows={vendas?.table ?? []} loading={loading} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
