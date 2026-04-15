"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { SalesChart, type Period } from "@/components/SalesChart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CondominioRanking {
  id: string;
  nome: string;
  percentualRepasse: number;
  vendas: number;
  repasse: number;
}

interface ConsolidadoPayload {
  totalVendas: number;
  totalRepasse: number;
  chart: Array<{ date: string; value: number }>;
  condominios: CondominioRanking[];
}

export function ConsolidadoView() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<ConsolidadoPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(`/api/dashboard/consolidado?period=${period}`)
      .then((r) => r.json())
      .then((json) => { if (!cancel) setData(json); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [period]);

  const periodLabel = period === "week" ? "Semana" : period === "month" ? "Mês" : "Ano";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-minimerx-navy">Visão Geral</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumo consolidado de todos os condomínios.
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard
          label={`Total de Vendas — ${periodLabel}`}
          value={formatCurrency(data?.totalVendas ?? 0)}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label={`Total de Repasse — ${periodLabel}`}
          value={formatCurrency(data?.totalRepasse ?? 0)}
          icon={Wallet}
          tone="accent"
          loading={loading}
        />
      </div>

      {/* Gráfico agregado */}
      <div className="mt-6">
        <SalesChart
          data={data?.chart ?? []}
          period={period}
          loading={loading}
          title={`Vendas consolidadas — ${periodLabel}`}
          barLabel="Vendas"
          color="#3DAE3C"
        />
      </div>

      {/* Ranking de condomínios */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-minimerx-navy">
          Ranking por condomínio — {periodLabel}
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Repasse</TableHead>
                  <TableHead className="text-center">% Repasse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.condominios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-minimerx-gray">
                      Nenhuma venda no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.condominios.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                            idx === 0 && "bg-yellow-100 text-yellow-700",
                            idx === 1 && "bg-slate-200 text-slate-600",
                            idx === 2 && "bg-orange-100 text-orange-700",
                            idx > 2 && "bg-slate-100 text-slate-400",
                          )}
                        >
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-minimerx-navy">
                        {c.nome}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.vendas)}
                      </TableCell>
                      <TableCell className="text-right text-minimerx-blue">
                        {formatCurrency(c.repasse)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="border-minimerx-green text-minimerx-green"
                        >
                          {formatPercent(c.percentualRepasse)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </main>
  );
}
