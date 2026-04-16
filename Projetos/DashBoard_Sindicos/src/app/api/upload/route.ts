import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcel } from "@/lib/excel-parser";
import { normalizeUnidade } from "@/lib/formatters";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { vendas, erros: parseErros } = parseExcel(buffer);

  if (vendas.length === 0 && parseErros.length === 0) {
    return NextResponse.json({ error: "Planilha vazia ou ilegível." }, { status: 400 });
  }

  const condominios = await prisma.condominio.findMany({
    select: { id: true, nome: true },
  });
  const mapa = new Map(condominios.map((c) => [normalizeUnidade(c.nome), c.id]));

  const paraInserir: Array<{ condominioId: string; unidade: string; data: Date; valorVenda: number }> = [];
  const naoEncontrados = new Set<string>();
  const erros = [...parseErros];

  for (const v of vendas) {
    const condId = mapa.get(v.unidadeNorm);
    if (!condId) {
      naoEncontrados.add(v.unidadeRaw);
      continue;
    }
    paraInserir.push({
      condominioId: condId,
      unidade: v.unidadeRaw,
      data: v.data,
      valorVenda: v.valorVenda,
    });
  }

  let importados = 0;
  if (paraInserir.length > 0) {
    const result = await prisma.$transaction(async (tx) => {
      const r = await tx.venda.createMany({
        data: paraInserir,
        skipDuplicates: true,
      });
      return r.count;
    });
    importados = result;
  }

  const ignorados = parseErros.length + naoEncontrados.size + (paraInserir.length - importados);

  return NextResponse.json({
    importados,
    ignorados,
    erros,
    condominiosNaoEncontrados: [...naoEncontrados],
  });
}
