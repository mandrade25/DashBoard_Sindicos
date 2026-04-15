"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Wallet, AlertCircle, RefreshCw } from "lucide-react";
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

interface DashboardViewProps {
  role: "ADMIN" | "SINDICO";
  condominioIdInicial: string | null;
  condominios: CondominioOption[];
}

export function DashboardView({ role, condominioIdInicial, condominios }: DashboardViewProps) {
  const [condominioId, setCondominioId] = useState<string | null>(() => {
    if (role === "ADMIN" && typeof window !== "undefined") {
      return localStorage.getItem(LS_KEY) || condominioIdInicial;
    }
    return condominioIdInicial;
  });
  const [period, setPeriod] = useState<Period>("month");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [vendas, setVendas] = useState<VendasPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function handleSelecionarCondominio(id: string) {
    setCondominioId(id);
    if (role === "ADMIN") localStorage.setItem(LS_KEY, id);
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
    ])
      .then(([r, v]) => {
        if (cancel) return;
        setResumo(r);
        setVendas(v);
      })
      .catch(() => {
        if (!cancel) setError(true);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => { cancel = true; };
  }

  useEffect(() => {
    if (!condominioId) { setLoading(false); return; }
    return loadData(condominioId, period);
  }, [condominioId, period]);

  // Validar que o condominioId do localStorage ainda existe na lista
  useEffect(() => {
    if (role === "ADMIN" && condominioId && condominios.length > 0) {
      const existe = condominios.some((c) => c.id === condominioId);
      if (!existe) {
        const primeiro = condominios[0]?.id ?? null;
        setCondominioId(primeiro);
        if (primeiro) localStorage.setItem(LS_KEY, primeiro);
        else localStorage.removeItem(LS_KEY);
      }
    }
  }, [condominios, condominioId, role]);

  const pct = resumo?.percentualRepasse ?? 0;
  const repasseChart = vendas?.chart.map((d) => ({
    date: d.date,
    value: pct > 0 ? (d.value * pct) / 100 : 0,
  })) ?? [];

  return (
    <>
      <Topbar
        role={role}
        condominioNome={
          condominios.find((c) => c.id === condominioId)?.nome ?? "Seu condomínio"
        }
        condominioIdSelecionado={condominioId ?? undefined}
        onSelecionarCondominio={handleSelecionarCondominio}
        condominios={role === "ADMIN" ? condominios : undefined}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {!condominioId ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-minimerx-navy">
              Nenhum condomínio cadastrado ainda
            </p>
            <p className="mt-2 text-sm text-minimerx-gray">
              Cadastre um condomínio em &ldquo;Condomínios&rdquo; para começar a visualizar vendas.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div>
              <p className="text-lg font-semibold text-red-700">Erro ao carregar dados</p>
              <p className="mt-1 text-sm text-red-500">
                Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                label="Mês atual"
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

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <MetricCard
                label="Repasse do mês"
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

            {/* Seletor de período compartilhado */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-minimerx-navy">Gráficos por período</h2>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mês</TabsTrigger>
                  <TabsTrigger value="year">Ano</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
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

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-minimerx-navy">Histórico detalhado</h2>
              <SalesTable rows={vendas?.table ?? []} loading={loading} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
