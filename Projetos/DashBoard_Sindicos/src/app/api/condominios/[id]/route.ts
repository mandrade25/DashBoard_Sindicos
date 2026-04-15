import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  nome: z.string().trim().min(2),
  percentualRepasse: z.number().min(0).max(100),
  sindicoNome: z.string().trim().min(2),
  sindicoEmail: z.string().trim().email(),
  sindicoSenha: z.string().min(8).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;

  const cond = await prisma.condominio.findUnique({
    where: { id: params.id },
    include: { usuarios: { where: { role: "SINDICO" }, take: 1 } },
  });
  if (!cond) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });

  const outroComNome = await prisma.condominio.findFirst({
    where: { nome: data.nome, NOT: { id: params.id } },
  });
  if (outroComNome) {
    return NextResponse.json({ error: "Já existe outro condomínio com este nome." }, { status: 409 });
  }

  const outroComEmail = await prisma.usuario.findFirst({
    where: { email: data.sindicoEmail, NOT: { id: cond.usuarios[0]?.id } },
  });
  if (outroComEmail) {
    return NextResponse.json({ error: "E-mail em uso por outro usuário." }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.condominio.update({
      where: { id: params.id },
      data: { nome: data.nome, percentualRepasse: data.percentualRepasse },
    });

    const sindicoExistente = cond.usuarios[0];
    if (sindicoExistente) {
      await tx.usuario.update({
        where: { id: sindicoExistente.id },
        data: {
          nome: data.sindicoNome,
          email: data.sindicoEmail,
          ...(data.sindicoSenha
            ? { senhaHash: await bcrypt.hash(data.sindicoSenha, 12) }
            : {}),
        },
      });
    } else if (data.sindicoSenha) {
      await tx.usuario.create({
        data: {
          nome: data.sindicoNome,
          email: data.sindicoEmail,
          senhaHash: await bcrypt.hash(data.sindicoSenha, 12),
          role: "SINDICO",
          condominioId: params.id,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
