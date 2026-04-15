import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, startOfMonth, startOfYear, startOfDay, addDays, addMonths } from "date-fns";

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
      ? startOfWeek(now, { weekStartsOn: 1 })
      : period === "month"
        ? startOfMonth(now)
        : startOfYear(now);

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

  // Chart: agregado por todos os condomínios no período
  const chartMap = new Map<string, number>();
  const condominioSomas = new Map<string, number>();

  if (period === "year") {
    for (const v of vendas) {
      const key = v.data.toISOString().substring(0, 7) + "-01";
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  } else if (period === "month") {
    for (const v of vendas) {
      const iso = v.data.toISOString();
      const day = parseInt(iso.substring(8, 10), 10);
      const bucketDay = Math.floor((day - 1) / 7) * 7 + 1;
      const key = iso.substring(0, 8) + String(bucketDay).padStart(2, "0");
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  } else {
    for (const v of vendas) {
      const key = v.data.toISOString().substring(0, 10);
      chartMap.set(key, (chartMap.get(key) ?? 0) + Number(v.valorVenda));
      condominioSomas.set(v.condominioId, (condominioSomas.get(v.condominioId) ?? 0) + Number(v.valorVenda));
    }
  }

  // Gerar datas para o chart
  const dates: string[] = [];
  if (period === "week") {
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(from, i).toISOString().substring(0, 10));
    }
  } else if (period === "month") {
    const yearNum = from.getUTCFullYear();
    const monthNum = from.getUTCMonth();
    const lastDay = new Date(Date.UTC(yearNum, monthNum + 1, 0)).getUTCDate();
    const yearStr = String(yearNum);
    const monthStr = String(monthNum + 1).padStart(2, "0");
    for (const bd of [1, 8, 15, 22, 29]) {
      if (bd <= lastDay) {
        dates.push(`${yearStr}-${monthStr}-${String(bd).padStart(2, "0")}`);
      }
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const d = addMonths(startOfYear(now), i);
      dates.push(d.toISOString().substring(0, 7) + "-01");
    }
  }

  const chart = dates.map((d) => ({ date: d, value: chartMap.get(d) ?? 0 }));

  // Totais
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

  // Ordenar por vendas desc
  condominioResults.sort((a, b) => b.vendas - a.vendas);

  return NextResponse.json({ totalVendas, totalRepasse, chart, condominios: condominioResults });
}

// Evita warning de unused import
void startOfDay;
