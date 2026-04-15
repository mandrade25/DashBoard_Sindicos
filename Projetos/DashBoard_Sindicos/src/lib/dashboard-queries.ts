import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, addDays, addMonths } from "date-fns";

export async function assertAcessoCondominio(
  userRole: "ADMIN" | "SINDICO",
  userCondominioId: string | null,
  condominioId: string,
): Promise<boolean> {
  if (userRole === "ADMIN") return true;
  return userCondominioId === condominioId;
}

export async function getResumo(condominioId: string) {
  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { percentualRepasse: true },
  });
  if (!condominio) return null;

  const hoje = startOfDay(new Date());
  const semana = startOfWeek(new Date(), { weekStartsOn: 1 });
  const mes = startOfMonth(new Date());
  const ano = startOfYear(new Date());

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
      ? startOfWeek(now, { weekStartsOn: 1 })
      : period === "month"
        ? startOfMonth(now)
        : startOfYear(now);

  const vendas = await prisma.venda.findMany({
    where: { condominioId, data: { gte: from } },
    orderBy: { data: "asc" },
    select: { data: true, valorVenda: true },
  });

  const map = new Map<string, number>();

  if (period === "year") {
    // agrupar por mês: chave = "YYYY-MM-01"
    for (const v of vendas) {
      const key = v.data.toISOString().substring(0, 7) + "-01";
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  } else if (period === "month") {
    // agrupar por semana do mês: dias 1-7, 8-14, 15-21, 22-28, 29-31
    for (const v of vendas) {
      const iso = v.data.toISOString(); // "YYYY-MM-DD..." UTC-based
      const day = parseInt(iso.substring(8, 10), 10);
      const bucketDay = Math.floor((day - 1) / 7) * 7 + 1;
      const key = iso.substring(0, 8) + String(bucketDay).padStart(2, "0");
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  } else {
    // week: agrupamento diário
    for (const v of vendas) {
      const key = v.data.toISOString().substring(0, 10);
      map.set(key, (map.get(key) ?? 0) + Number(v.valorVenda));
    }
  }

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
    // year: 12 meses
    for (let i = 0; i < 12; i++) {
      const d = addMonths(startOfYear(now), i);
      dates.push(d.toISOString().substring(0, 7) + "-01");
    }
  }

  const chart = dates.map((d) => ({ date: d, value: map.get(d) ?? 0 }));

  let acc = 0;
  const tableDesc = [...chart]
    .filter((c) => c.value > 0)
    .reverse();
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

