import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasCondominioAccess } from "@/lib/condominio-access";
import { prisma } from "@/lib/prisma";
import { competenciaLabel } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");

  if (!condominioId) {
    return NextResponse.json({ error: "Condominio obrigatorio." }, { status: 400 });
  }

  if (!hasCondominioAccess(session.user, condominioId)) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const items = await prisma.auditLog.findMany({
    where: {
      tipo: "COMPETENCIA_CONFIRMADA",
      entidade: "Competencia",
      payload: {
        path: ["condominioId"],
        equals: condominioId,
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      entidadeId: item.entidadeId,
      criadoEm: item.criadoEm.toISOString(),
      payload: item.payload,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { condominioId?: string; competencia?: string }
    | null;

  const condominioId = body?.condominioId?.trim();
  const competencia = body?.competencia?.trim();

  if (!condominioId || !competencia) {
    return NextResponse.json({ error: "Condominio e competencia sao obrigatorios." }, { status: 400 });
  }

  if (!hasCondominioAccess(session.user, condominioId)) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const entidadeId = `${condominioId}:${competencia}`;

  const existing = await prisma.auditLog.findFirst({
    where: {
      tipo: "COMPETENCIA_CONFIRMADA",
      entidade: "Competencia",
      entidadeId,
    },
    orderBy: { criadoEm: "desc" },
  });

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      created: false,
      confirmadoEm: existing.criadoEm.toISOString(),
    });
  }

  const created = await prisma.auditLog.create({
    data: {
      tipo: "COMPETENCIA_CONFIRMADA",
      entidade: "Competencia",
      entidadeId,
      usuarioId: session.user.id ?? null,
      usuarioRole: session.user.role,
      descricao: `Competencia ${competenciaLabel(competencia)} confirmada pelo condominio.`,
      payload: {
        condominioId,
        competencia,
        origem: "portal",
      },
    },
  });

  return NextResponse.json({
    id: created.id,
    created: true,
    confirmadoEm: created.criadoEm.toISOString(),
  });
}
