import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCompetencia } from "@/lib/competencia";
import { LayoutShell } from "@/components/LayoutShell";

// Garante renderização dinâmica em cada request.
// Sem isso, o Next.js pode tentar cachear o RSC payload do layout,
// fazendo com que o Cloudflare (ou o próprio framework) sirva
// referências a chunks antigos mesmo após um rebuild limpo.
export const dynamic = "force-dynamic";

async function getPendenciasCount(): Promise<number> {
  const now = new Date();
  const competencias: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    competencias.push(toCompetencia(d));
  }

  const [allCondominios, comprovantesExistentes] = await Promise.all([
    prisma.condominio.findMany({ select: { id: true, dataInicio: true } }),
    prisma.comprovante.findMany({
      where: { competencia: { in: competencias }, status: { in: ["ANEXADO", "ENVIADO"] } },
      select: { condominioId: true, competencia: true, status: true },
    }),
  ]);

  const enviadosSet = new Set(
    comprovantesExistentes.filter((c) => c.status === "ENVIADO").map((c) => `${c.condominioId}:${c.competencia}`),
  );
  const existentesSet = new Set(comprovantesExistentes.map((c) => `${c.condominioId}:${c.competencia}`));

  let count = 0;
  for (const cond of allCondominios) {
    const inicioOperacao = toCompetencia(cond.dataInicio);
    for (const comp of competencias) {
      if (comp < inicioOperacao) continue;
      const key = `${cond.id}:${comp}`;
      if (!existentesSet.has(key) || !enviadosSet.has(key)) count++;
    }
  }
  return count;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  const [condominioNome, pendenciasCount] = await Promise.all([
    role === "SINDICO" && session.user.condominioId
      ? prisma.condominio.findUnique({ where: { id: session.user.condominioId }, select: { nome: true } }).then((c) => c?.nome ?? null)
      : Promise.resolve(null),
    role === "ADMIN" ? getPendenciasCount() : Promise.resolve(0),
  ]);

  return (
    <LayoutShell
      role={role}
      usuarioNome={session.user.name ?? "Usuário"}
      condominioNome={condominioNome}
      pendenciasCount={pendenciasCount}
    >
      {children}
    </LayoutShell>
  );
}
