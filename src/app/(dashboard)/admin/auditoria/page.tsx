import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuditoriaView } from "./auditoria-view";

const PAGE_SIZE = 30;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    tipo?: string;
    entidade?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const page = Math.max(1, Number(resolvedSearchParams.page ?? "1"));
  const tipo = resolvedSearchParams.tipo ?? undefined;
  const entidade = resolvedSearchParams.entidade ?? undefined;
  const from = resolvedSearchParams.from;
  const to = resolvedSearchParams.to;

  const where = {
    ...(tipo ? { tipo } : {}),
    ...(entidade ? { entidade } : {}),
    ...(from || to
      ? {
          criadoEm: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const tipos = await prisma.auditLog.findMany({
    select: { tipo: true },
    distinct: ["tipo"],
    orderBy: { tipo: "asc" },
  });

  return (
    <AuditoriaView
      items={items.map((i) => ({ ...i, criadoEm: i.criadoEm.toISOString(), payload: i.payload as Record<string, unknown> | null }))}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      tiposDisponiveis={tipos.map((t) => t.tipo)}
      filters={{ tipo: tipo ?? null, entidade: entidade ?? null, from: from ?? null, to: to ?? null }}
    />
  );
}
