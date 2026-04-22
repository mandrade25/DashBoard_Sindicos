"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateShort,
  formatMonth,
  formatMonthLong,
  formatWeekLabel,
  formatWeekTooltip,
} from "@/lib/formatters";

export type Period = "week" | "month" | "year";

export interface SalesChartProps {
  data: Array<{ date: string; value: number }>;
  period: Period;
  loading?: boolean;
  title?: string;
  barLabel?: string;
  color?: string;
}

function xAxisFormatter(period: Period) {
  return (v: string) => {
    if (period === "year") return formatMonth(v);
    if (period === "month") return formatWeekLabel(v);
    return formatDateShort(v);
  };
}

function tooltipLabelFormatter(period: Period) {
  return (v: string) => {
    if (period === "year") return formatMonthLong(v);
    if (period === "month") return formatWeekTooltip(v);
    return formatDate(v);
  };
}

export function SalesChart({
  data,
  period,
  loading,
  title = "Vendas por período",
  barLabel = "Vendas",
  color = "#3DAE3C",
}: SalesChartProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : data.length === 0 || data.every((d) => d.value === 0) ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-minimerx-gray">
            Nenhum dado encontrado no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EE" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#8A94A6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={xAxisFormatter(period)}
              />
              <YAxis
                stroke="#8A94A6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v) => formatCurrencyCompact(v)}
              />
              <Tooltip
                cursor={{ fill: "rgba(61,174,60,0.08)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E8EE",
                  fontSize: 12,
                }}
                labelFormatter={tooltipLabelFormatter(period)}
                formatter={(v: number) => [formatCurrency(v), barLabel]}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
