import { prisma } from "@/lib/prisma";
import {
  formatUtcDateKey,
  formatUtcMonthKey,
  getUtcMonthBucketKey,
  getUtcStartOfDay,
  getUtcStartOfMonth,
  getUtcStartOfWeek,
  getUtcStartOfYear,
  listUtcMonthBucketKeys,
  listUtcWeekKeys,
  listUtcYearMonthKeys,
} from "@/lib/date-buckets";

export async function assertAcessoCondominio(
  userRole: "ADMIN" | "SINDICO",
  userCondominioIds: string[],
  condominioId: string,
): Promise<boolean> {
  if (userRole === "ADMIN") return true;
  return userCondominioIds.includes(condominioId);
}

export async function getResumo(condominioId: string) {
  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { percentualRepasse: true },
  });
  if (!condominio) return null;

  const now = new Date();
  const hoje = getUtcStartOfDay(now);
  const semana = getUtcStartOfWeek(now);
  const mes = getUtcStartOfMonth(now);
  const ano = getUtcStartOfYear(now);

  const [r1, r2, r3, r4] = await Promise.all([
    prisma.venda.aggregate({
      where: { condominioId, data: { gte: hoje } },
      _sum: { valorVenda: true },
    }),
    prisma.venda.aggregate({
      where: { condominioId, data: { gte: semana } },
      _sum: { valorVenda: true },
    }),
    prisma.venda.aggregate({
      where: { condominioId, data: { gte: mes } },
      _sum: { valorVenda: true },
    }),
    prisma.venda.aggregate({
      where: { condominioId, data: { gte: ano } },
      _sum: { valorVenda: true },
    }),
  ]);

  const somaHoje = Number(r1._sum.valorVenda ?? 0);
  const somaSemana = Number(r2._sum.valorVenda ?? 0);
  const somaMes = Number(r3._sum.valorVenda ?? 0);
  const somaAno = Number(r4._sum.valorVenda ?? 0);
  const pct = Number(condominio.percentualRepasse);

  return {
    hoje: somaHoje,
    semana: somaSemana,
    mes: somaMes,
    ano: somaAno,
    repasseMes: (somaMes * pct) / 100,
    repasseAno: (somaAno * pct) / 100,
    percentualRepasse: pct,
  };
}

export async function getVendas(condominioId: string, period: "week" | "month" | "year") {
  const now = new Date();
  const from =
    period === "week"
      ? getUtcStartOfWeek(now)
      : period === "month"
        ? getUtcStartOfMonth(now)
        : getUtcStartOfYear(now);

  const vendas = await prisma.venda.findMany({
    where: { condominioId, data: { gte: from } },
    orderBy: { data: "asc" },
    select: { data: true, valorVenda: true },
  });

  const map = new Map<string, number>();

  if (period === "year") {
    for (const v of vendas) {
      const key = formatUtcMonthKey(v.data);
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  } else if (period === "month") {
    for (const v of vendas) {
      const key = getUtcMonthBucketKey(v.data);
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  } else {
    for (const v of vendas) {
      const key = formatUtcDateKey(v.data);
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  }

  const dates =
    period === "week"
      ? listUtcWeekKeys(from)
      : period === "month"
        ? listUtcMonthBucketKeys(from)
        : listUtcYearMonthKeys(getUtcStartOfYear(now));

  const chart = dates.map((d) => ({ date: d, value: map.get(d) ?? 0 }));

  let acc = 0;
  const tableDesc = [...chart].filter((c) => c.value > 0).reverse();
  const accMap = new Map<string, number>();
  for (const c of chart) {
    if (c.value > 0) {
      acc += c.value;
      accMap.set(c.date, acc);
    }
  }

  const table = tableDesc.map((c) => ({
    date: c.date,
    value: c.value,
    accumulated: accMap.get(c.date) ?? 0,
  }));

  return { chart, table };
}
