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
      usuarios: {
        where: { role: "SINDICO" },
        select: { id: true, nome: true, email: true },
        take: 1,
      },
    },
  });

  const items = condominios.map((c) => ({
    id: c.id,
    nome: c.nome,
    percentualRepasse: Number(c.percentualRepasse),
    sindico: c.usuarios[0] ?? null,
  }));

  return <CondominiosView items={items} />;
}
