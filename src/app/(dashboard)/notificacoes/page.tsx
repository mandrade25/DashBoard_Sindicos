import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getAccessibleCondominioIds,
  resolveSelectedCondominioId,
} from "@/lib/condominio-access";
import { prisma } from "@/lib/prisma";
import { NotificacoesView } from "./notificacoes-view";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ condominioId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SINDICO") {
    redirect("/dashboard");
  }

  const sindicoCondominioIds = getAccessibleCondominioIds(session.user);

  const condominios = await prisma.condominio.findMany({
    where: { id: { in: sindicoCondominioIds } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const selectedCondominioId = resolveSelectedCondominioId({
    user: session.user,
    requestedCondominioId: resolvedSearchParams?.condominioId,
    fallbackCondominioIds: condominios.map((item) => item.id),
  });

  if (!selectedCondominioId) {
    redirect("/dashboard");
  }

  const [condominio, emails] = await Promise.all([
    prisma.condominio.findUnique({
      where: { id: selectedCondominioId },
      select: { nome: true },
    }),
    prisma.emailNotificacao.findMany({
      where: { condominioId: selectedCondominioId },
      orderBy: { emailNormalizado: "asc" },
      select: {
        id: true,
        email: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    }),
  ]);

  return (
    <NotificacoesView
      condominioNome={condominio?.nome ?? "Seu condominio"}
      condominioIdSelecionado={selectedCondominioId}
      condominios={condominios}
      initialItems={emails.map((item) => ({
        ...item,
        criadoEm: item.criadoEm.toISOString(),
        atualizadoEm: item.atualizadoEm.toISOString(),
      }))}
    />
  );
}
