import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competenciaLabel } from "@/lib/competencia";
import { ObservacoesView } from "./observacoes-view";

export default async function ObservacoesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const items = await prisma.comprovante.findMany({
    where: {
      observacao: { not: null },
      status: { not: "CANCELADO" },
    },
    include: {
      condominio: {
        select: { nome: true },
      },
    },
    orderBy: [{ competencia: "desc" }, { atualizadoEm: "desc" }],
    take: 300,
  });

  return (
    <ObservacoesView
      items={items
        .filter((item) => item.observacao?.trim())
        .map((item) => ({
          id: item.id,
          condominioNome: item.condominio.nome,
          competencia: item.competencia,
          competenciaLabel: competenciaLabel(item.competencia),
          texto: item.observacao ?? "",
          escopo: item.visivelSindico ? "PUBLICA" : "INTERNA",
          status: item.visivelSindico ? "Publicada publica" : "Publicada interna",
          atualizadoEm: item.atualizadoEm.toISOString(),
        }))}
    />
  );
}
