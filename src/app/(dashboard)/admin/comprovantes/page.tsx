import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ComprovantesView } from "./comprovantes-view";

export const metadata = { title: "Comprovantes — MiniMerX" };

export default async function ComprovantesPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const condominios = await prisma.condominio.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, percentualRepasse: true },
  });

  const comprovantes = await prisma.comprovante.findMany({
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
    include: { condominio: { select: { nome: true } } },
    take: 100,
  });

  return (
    <ComprovantesView
      condominios={condominios.map((c) => ({ ...c, percentualRepasse: c.percentualRepasse.toString() }))}
      initialComprovantes={comprovantes.map((c) => ({
        ...c,
        valorRepasse: c.valorRepasse.toString(),
        dataPagamento: c.dataPagamento.toISOString(),
        criadoEm: c.criadoEm.toISOString(),
        atualizadoEm: c.atualizadoEm.toISOString(),
      }))}
    />
  );
}
