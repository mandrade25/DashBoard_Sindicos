import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  nome: z.string().trim().min(2),
  percentualRepasse: z.number().min(0).max(100),
  dataInicio: z.string().regex(/^\d{4}-\d{2}$/, "Formato invalido (YYYY-MM)"),
  sindicoNome: z.string().trim().min(2),
  sindicoEmail: z.string().trim().email(),
  sindicoSenha: z.string().min(8).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados invalidos" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const cond = await prisma.condominio.findUnique({
    where: { id },
    include: {
      acessosUsuarios: {
        take: 1,
        orderBy: { criadoEm: "desc" },
        include: { usuario: true },
      },
    },
  });
  if (!cond) {
    return NextResponse.json({ error: "Condominio nao encontrado" }, { status: 404 });
  }

  const outroComNome = await prisma.condominio.findFirst({
    where: { nome: data.nome, NOT: { id } },
  });
  if (outroComNome) {
    return NextResponse.json(
      { error: "Ja existe outro condominio com este nome." },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.condominio.update({
      where: { id },
      data: {
        nome: data.nome,
        percentualRepasse: data.percentualRepasse,
        dataInicio: new Date(`${data.dataInicio}-01`),
      },
    });

    const acessosAtuais = cond.acessosUsuarios.map((acesso) => acesso.usuario);
    const sindicoAtual = acessosAtuais[0] ?? null;
    const usuarioPorEmail = await tx.usuario.findUnique({
      where: { email: data.sindicoEmail },
    });
    const senhaHash = data.sindicoSenha ? await bcrypt.hash(data.sindicoSenha, 12) : undefined;

    async function definirAcessosDoCondominio(usuarioId: string) {
      await tx.usuarioCondominio.deleteMany({
        where: {
          condominioId: id,
          NOT: { usuarioId },
        },
      });

      await tx.usuarioCondominio.upsert({
        where: {
          usuarioId_condominioId: {
            usuarioId,
            condominioId: id,
          },
        },
        update: {},
        create: {
          usuarioId,
          condominioId: id,
        },
      });
    }

    if (sindicoAtual && (!usuarioPorEmail || usuarioPorEmail.id === sindicoAtual.id)) {
      await tx.usuario.update({
        where: { id: sindicoAtual.id },
        data: {
          nome: data.sindicoNome,
          email: data.sindicoEmail,
          ...(senhaHash ? { senhaHash } : {}),
        },
      });

      await definirAcessosDoCondominio(sindicoAtual.id);
      return;
    }

    if (usuarioPorEmail) {
      await tx.usuario.update({
        where: { id: usuarioPorEmail.id },
        data: {
          nome: data.sindicoNome,
          role: "SINDICO",
          condominioId: usuarioPorEmail.condominioId ?? id,
          ...(senhaHash ? { senhaHash } : {}),
        },
      });

      await definirAcessosDoCondominio(usuarioPorEmail.id);
      return;
    }

    if (!senhaHash) {
      return;
    }

    const novoUsuario = await tx.usuario.create({
      data: {
        nome: data.sindicoNome,
        email: data.sindicoEmail,
        senhaHash,
        role: "SINDICO",
        condominioId: id,
      },
    });

    await definirAcessosDoCondominio(novoUsuario.id);
  });

  return NextResponse.json({ ok: true });
}
