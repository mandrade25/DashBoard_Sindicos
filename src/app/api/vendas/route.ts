import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const condominioId = searchParams.get("condominioId") || undefined;
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 15;

  const where = {
    ...(condominioId ? { condominioId } : {}),
    ...(dataInicio || dataFim
      ? {
          data: {
            ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
            ...(dataFim ? { lte: new Date(dataFim) } : {}),
          },
        }
      : {}),
  };

  const [total, vendas] = await Promise.all([
    prisma.venda.count({ where }),
    prisma.venda.findMany({
      where,
      orderBy: [{ data: "desc" }, { importadoEm: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        data: true,
        unidade: true,
        valorVenda: true,
        importadoEm: true,
        condominio: { select: { id: true, nome: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    vendas: vendas.map((v) => ({
      id: v.id,
      data: v.data.toISOString().substring(0, 10),
      unidade: v.unidade,
      valorVenda: Number(v.valorVenda),
      importadoEm: v.importadoEm.toISOString(),
      condominioId: v.condominio.id,
      condominioNome: v.condominio.nome,
    })),
  });
}

const deleteSchema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  }

  const { count } = await prisma.venda.deleteMany({
    where: { id: { in: parsed.data.ids } },
  });

  return NextResponse.json({ excluidos: count });
}
