import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPastCompetencia, nextMonthStart } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  const competencia = searchParams.get("competencia");

  if (!condominioId || !competencia) {
    return NextResponse.json({ error: "Condomínio e competência são obrigatórios." }, { status: 400 });
  }

  if (!isValidPastCompetencia(competencia)) {
    return NextResponse.json({ error: "Competência inválida ou futura." }, { status: 400 });
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { percentualRepasse: true },
  });

  if (!condominio) {
    return NextResponse.json({ error: "Condomínio não encontrado." }, { status: 404 });
  }

  const competenciaStart = new Date(`${competencia}-01`);
  const competenciaEnd = nextMonthStart(competencia);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId, data: { gte: competenciaStart, lt: competenciaEnd } },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);
  const percentualRepasse = Number(condominio.percentualRepasse);
  const repasseEstimado = faturamento * (percentualRepasse / 100);

  return NextResponse.json({
    faturamento,
    percentualRepasse,
    repasseEstimado,
  });
}
