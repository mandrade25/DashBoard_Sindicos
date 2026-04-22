import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getSindicoCondominioAccess,
  normalizeNotificationEmail,
  notificationEmailSchema,
  notificationEmailSelect,
} from "@/lib/notification-emails";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authResult = await getSindicoCondominioAccess(searchParams.get("condominioId"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const items = await prisma.emailNotificacao.findMany({
    where: { condominioId: authResult.condominioId },
    orderBy: { emailNormalizado: "asc" },
    select: notificationEmailSelect,
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const authResult = await getSindicoCondominioAccess(searchParams.get("condominioId"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.emailNotificacao.create({
      data: {
        condominioId: authResult.condominioId,
        email: parsed.data.email,
        emailNormalizado: normalizeNotificationEmail(parsed.data.email),
      },
      select: notificationEmailSelect,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado para o condomínio." },
        { status: 409 },
      );
    }

    throw error;
  }
}
