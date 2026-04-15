import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  nome: z.string().trim().min(2),
  percentualRepasse: z.number().min(0).max(100),
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
      usuarios: {
        where: { role: "SINDICO" },
        select: { id: true, nome: true, email: true },
        take: 1,
      },
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;

  const existente = await prisma.condominio.findUnique({ where: { nome: data.nome } });
  if (existente) {
    return NextResponse.json({ error: "Já existe um condomínio com este nome." }, { status: 409 });
  }
  const emailEmUso = await prisma.usuario.findUnique({ where: { email: data.sindicoEmail } });
  if (emailEmUso) {
    return NextResponse.json({ error: "E-mail já cadastrado para outro usuário." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(data.sindicoSenha, 12);
  const condominio = await prisma.condominio.create({
    data: {
      nome: data.nome,
      percentualRepasse: data.percentualRepasse,
      usuarios: {
        create: {
          nome: data.sindicoNome,
          email: data.sindicoEmail,
          senhaHash,
          role: "SINDICO",
        },
      },
    },
  });

  return NextResponse.json({ id: condominio.id }, { status: 201 });
}
