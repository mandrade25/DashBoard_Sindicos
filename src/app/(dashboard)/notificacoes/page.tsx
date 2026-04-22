import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificacoesView } from "./notificacoes-view";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams?: { condominioId?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SINDICO") {
    redirect("/dashboard");
  }

  const sindicoCondominioIds = Array.from(
    new Set([
      ...(session.user.condominioIds ?? []),
      ...(session.user.condominioId ? [session.user.condominioId] : []),
    ]),
  );

  const condominios = await prisma.condominio.findMany({
    where: { id: { in: sindicoCondominioIds } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const selectedCondominioId =
    condominios.some((item) => item.id === searchParams?.condominioId)
      ? searchParams?.condominioId ?? null
      : session.user.condominioId ?? condominios[0]?.id ?? null;

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
      condominioNome={condominio?.nome ?? "Seu condomínio"}
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
