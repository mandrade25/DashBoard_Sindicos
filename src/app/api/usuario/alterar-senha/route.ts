import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { senhaAtual, novaSenha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { id: session.user.id } });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!senhaCorreta) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });

  const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: novaSenhaHash } });

  return NextResponse.json({ ok: true });
}
