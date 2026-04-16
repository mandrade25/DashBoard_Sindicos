import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatUtcDateKey,
  formatUtcMonthKey,
  getUtcMonthBucketKey,
  getUtcStartOfMonth,
  getUtcStartOfWeek,
  getUtcStartOfYear,
  listUtcMonthBucketKeys,
  listUtcWeekKeys,
  listUtcYearMonthKeys,
} from "@/lib/date-buckets";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const period = (req.nextUrl.searchParams.get("period") ?? "month") as
    | "week"
    | "month"
    | "year";
  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const now = new Date();
  const from =
    period === "week"
      ? getUtcStartOfWeek(now)
      : period === "month"
        ? getUtcStartOfMonth(now)
        : getUtcStartOfYear(now);

  const [condominios, vendas] = await Promise.all([
    prisma.condominio.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, percentualRepasse: true },
    }),
    prisma.venda.findMany({
      where: { data: { gte: from } },
      orderBy: { data: "asc" },
      select: { condominioId: true, data: true, valorVenda: true },
    }),
  ]);

  const chartMap = new Map<string, number>();
  const condominioSomas = new Map<string, number>();

  if (period === "year") {
    for (const v of vendas) {
      const key = formatUtcMonthKey(v.data);
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  } else if (period === "month") {
    for (const v of vendas) {
      const key = getUtcMonthBucketKey(v.data);
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  } else {
    for (const v of vendas) {
      const key = formatUtcDateKey(v.data);
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  }

  const dates =
    period === "week"
      ? listUtcWeekKeys(from)
      : period === "month"
        ? listUtcMonthBucketKeys(from)
        : listUtcYearMonthKeys(getUtcStartOfYear(now));

  const chart = dates.map((d) => ({ date: d, value: chartMap.get(d) ?? 0 }));

  let totalVendas = 0;
  let totalRepasse = 0;
  const condominioResults = condominios.map((c) => {
    const vendas = condominioSomas.get(c.id) ?? 0;
    const pct = Number(c.percentualRepasse);
    const repasse = (vendas * pct) / 100;
    totalVendas += vendas;
    totalRepasse += repasse;
    return {
      id: c.id,
      nome: c.nome,
      percentualRepasse: pct,
      vendas,
      repasse,
    };
  });

  condominioResults.sort((a, b) => b.vendas - a.vendas);

  return NextResponse.json({ totalVendas, totalRepasse, chart, condominios: condominioResults });
}
