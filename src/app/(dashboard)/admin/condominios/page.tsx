import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CondominiosView } from "./condominios-view";

export const dynamic = "force-dynamic";

export default async function CondominiosPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const condominios = await prisma.condominio.findMany({
    orderBy: { nome: "asc" },
    include: {
      acessosUsuarios: {
        orderBy: { criadoEm: "desc" },
        take: 1,
        select: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      },
    },
  });

  const items = condominios.map((c) => ({
    id: c.id,
    nome: c.nome,
    percentualRepasse: Number(c.percentualRepasse),
    dataInicio: c.dataInicio.toISOString().substring(0, 7),
    sindico: c.acessosUsuarios[0]?.usuario ?? null,
  }));

  return <CondominiosView items={items} />;
}
