import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getSindicoCondominioAccess,
  normalizeNotificationEmail,
  notificationEmailSchema,
  notificationEmailSelect,
} from "@/lib/notification-emails";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const authResult = await getSindicoCondominioAccess(searchParams.get("condominioId"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const existing = await prisma.emailNotificacao.findFirst({
    where: {
      id,
      condominioId: authResult.condominioId,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "E-mail nao encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.emailNotificacao.update({
      where: { id: existing.id },
      data: {
        email: parsed.data.email,
        emailNormalizado: normalizeNotificationEmail(parsed.data.email),
      },
      select: notificationEmailSelect,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este e-mail ja esta cadastrado para o condominio." },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const authResult = await getSindicoCondominioAccess(searchParams.get("condominioId"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const existing = await prisma.emailNotificacao.findFirst({
    where: {
      id,
      condominioId: authResult.condominioId,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "E-mail nao encontrado." }, { status: 404 });
  }

  await prisma.emailNotificacao.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
