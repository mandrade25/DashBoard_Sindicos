import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  nome: z.string().trim().min(2),
  percentualRepasse: z.number().min(0).max(100),
  dataInicio: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
  sindicoNome: z.string().trim().min(2),
  sindicoEmail: z.string().trim().email(),
  sindicoSenha: z.string().min(8),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const items = await prisma.condominio.findMany({
    orderBy: { nome: "asc" },
    include: {
      acessosUsuarios: {
        take: 1,
        orderBy: { criadoEm: "desc" },
        select: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      },
    },
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      sindico: item.acessosUsuarios[0]?.usuario ?? null,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const existente = await prisma.condominio.findUnique({ where: { nome: data.nome } });
  if (existente) {
    return NextResponse.json(
      { error: "Já existe um condomínio com este nome." },
      { status: 409 },
    );
  }

  const condominio = await prisma.$transaction(async (tx) => {
    const usuarioExistente = await tx.usuario.findUnique({
      where: { email: data.sindicoEmail },
    });
    const senhaHash = await bcrypt.hash(data.sindicoSenha, 12);

    const novoCondominio = await tx.condominio.create({
      data: {
        nome: data.nome,
        percentualRepasse: data.percentualRepasse,
        dataInicio: new Date(`${data.dataInicio}-01`),
      },
    });

    const usuario =
      usuarioExistente ??
      (await tx.usuario.create({
        data: {
          nome: data.sindicoNome,
          email: data.sindicoEmail,
          senhaHash,
          role: "SINDICO",
          condominioId: novoCondominio.id,
        },
      }));

    if (usuarioExistente) {
      await tx.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nome: data.sindicoNome,
          senhaHash,
          role: "SINDICO",
          condominioId: usuarioExistente.condominioId ?? novoCondominio.id,
        },
      });
    }

    await tx.usuarioCondominio.upsert({
      where: {
        usuarioId_condominioId: {
          usuarioId: usuario.id,
          condominioId: novoCondominio.id,
        },
      },
      update: {},
      create: {
        usuarioId: usuario.id,
        condominioId: novoCondominio.id,
      },
    });

    return novoCondominio;
  });

  return NextResponse.json({ id: condominio.id }, { status: 201 });
}
