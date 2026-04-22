import { NextResponse } from "next/server";
import { z } from "zod";
import { FormaPagamento } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, ALLOWED_MIME_TYPES, MAX_FILE_BYTES, computeHash } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";
import { nextMonthStart } from "@/lib/competencia";

const VALOR_TOLERANCIA = 0.02;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const comp = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: {
      condominio: { select: { nome: true, percentualRepasse: true } },
      versaoAnterior: { select: { id: true, nomeArquivo: true, criadoEm: true, status: true } },
      envios: {
        orderBy: { criadoEm: "desc" },
        take: 5,
        include: { destinatarios: true },
      },
    },
  });

  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  if (session.user.role === "SINDICO" && session.user.condominioId !== comp.condominioId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  return NextResponse.json(comp);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { condominio: { select: { nome: true, percentualRepasse: true } } },
  });
  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (comp.status === "CANCELADO") return NextResponse.json({ error: "Não é possível editar comprovante cancelado." }, { status: 409 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const { valorRepasse, dataPagamento, formaPagamento, observacao, visivelSindico, confirmarDivergencia } =
    body as Record<string, unknown>;

  const formaEnum = formaPagamento ? z.nativeEnum(FormaPagamento).safeParse(formaPagamento) : null;
  const valorRepasseNumber =
    valorRepasse !== undefined ? parseFloat(String(valorRepasse)) : Number(comp.valorRepasse);

  if (Number.isNaN(valorRepasseNumber) || valorRepasseNumber <= 0) {
    return NextResponse.json({ error: "Valor de repasse invÃ¡lido." }, { status: 400 });
  }

  const competenciaStart = new Date(`${comp.competencia}-01`);
  const competenciaEnd = nextMonthStart(comp.competencia);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId: comp.condominioId, data: { gte: competenciaStart, lt: competenciaEnd } },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);
  const percentualRepasse = Number(comp.condominio.percentualRepasse);
  const repasseEsperado = faturamento * (percentualRepasse / 100);
  const divergencia = Math.abs(valorRepasseNumber - repasseEsperado);
  const temDivergencia = divergencia > VALOR_TOLERANCIA;

  if (temDivergencia && confirmarDivergencia !== true) {
    return NextResponse.json(
      {
        error: "O valor informado difere do repasse calculado para a competÃªncia.",
        requiresConfirmation: true,
        valorInformado: valorRepasseNumber,
        repasseEsperado,
        divergencia,
      },
      { status: 409 },
    );
  }

  await prisma.comprovante.update({
    where: { id: params.id },
    data: {
      ...(valorRepasse !== undefined ? { valorRepasse: valorRepasseNumber } : {}),
      ...(dataPagamento ? { dataPagamento: new Date(String(dataPagamento)) } : {}),
      ...(formaEnum?.success ? { formaPagamento: formaEnum.data } : {}),
      ...(observacao !== undefined ? { observacao: (observacao as string) || null } : {}),
      ...(visivelSindico !== undefined ? { visivelSindico: Boolean(visivelSindico) } : {}),
    },
  });

  await logAudit({
    tipo: "COMPROVANTE_ATUALIZADO",
    entidade: "Comprovante",
    entidadeId: comp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Dados do comprovante atualizados — ${comp.condominio.nome} / ${comp.competencia}`,
    ip: getIp(req),
  });

  return NextResponse.json({
    ok: true,
    temDivergencia,
    divergencia: temDivergencia ? divergencia : 0,
    repasseEsperado: temDivergencia ? repasseEsperado : valorRepasseNumber,
    valorInformado: valorRepasseNumber,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const anterior = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { condominio: { select: { nome: true } } },
  });

  if (!anterior) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (anterior.status === "CANCELADO") {
    return NextResponse.json({ error: "Não é possível substituir comprovante cancelado." }, { status: 409 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "FormData inválido." }, { status: 400 });

  const arquivo = formData.get("arquivo") as File | null;
  const justificativa = (formData.get("justificativa") as string | null)?.trim();
  const valorRepasseRaw = formData.get("valorRepasse") as string | null;
  const dataPagamento = formData.get("dataPagamento") as string | null;
  const formaPagamentoRaw = formData.get("formaPagamento") as string | null;
  const observacao = formData.get("observacao") as string | null;
  const visivelSindico = formData.get("visivelSindico") === "true";

  if (!arquivo || !justificativa || justificativa.length < 10) {
    return NextResponse.json({ error: "Arquivo e justificativa (mín. 10 caracteres) são obrigatórios." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(arquivo.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json({ error: "Formato não permitido. Use PDF, JPG ou PNG." }, { status: 400 });
  }

  if (arquivo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 10 MB." }, { status: 400 });
  }

  const formaEnum = formaPagamentoRaw ? z.nativeEnum(FormaPagamento).safeParse(formaPagamentoRaw) : null;
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const hash = computeHash(buffer);

  const { relativePath } = await saveFile({
    condominioId: anterior.condominioId,
    competencia: anterior.competencia,
    filename: arquivo.name,
    buffer,
  });

  const [, novoComp] = await prisma.$transaction([
    prisma.comprovante.update({ where: { id: anterior.id }, data: { status: "SUBSTITUIDO" } }),
    prisma.comprovante.create({
      data: {
        condominioId: anterior.condominioId,
        competencia: anterior.competencia,
        nomeArquivo: arquivo.name,
        caminhoArquivo: relativePath,
        mimeType: arquivo.type,
        tamanhoBytes: arquivo.size,
        hashArquivo: hash,
        valorRepasse: valorRepasseRaw ? parseFloat(valorRepasseRaw) : anterior.valorRepasse,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : anterior.dataPagamento,
        formaPagamento: formaEnum?.success ? formaEnum.data : anterior.formaPagamento,
        observacao: observacao || anterior.observacao,
        visivelSindico,
        justificativa,
        versaoAnteriorId: anterior.id,
        criadoPorId: session.user.id,
        status: "ANEXADO",
      },
    }),
  ]);

  await logAudit({
    tipo: "COMPROVANTE_SUBSTITUIDO",
    entidade: "Comprovante",
    entidadeId: novoComp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante substituído — ${anterior.condominio.nome} / ${anterior.competencia}. Justificativa: ${justificativa}`,
    payload: { anteriorId: anterior.id, novoId: novoComp.id },
    ip: getIp(req),
  });

  return NextResponse.json({ id: novoComp.id });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { condominio: { select: { nome: true } } },
  });

  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (comp.status === "CANCELADO") return NextResponse.json({ error: "Já cancelado." }, { status: 409 });

  if (comp.status === "ANEXADO") {
    await prisma.comprovante.update({ where: { id: params.id }, data: { status: "CANCELADO" } });

    await logAudit({
      tipo: "COMPROVANTE_CANCELADO",
      entidade: "Comprovante",
      entidadeId: comp.id,
      usuarioId: session.user.id,
      usuarioRole: session.user.role,
      descricao: `Comprovante excluído (ANEXADO) — ${comp.condominio.nome} / ${comp.competencia}`,
      ip: getIp(req),
    });

    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const justificativa = (body?.justificativa as string | undefined)?.trim();

  if (!justificativa || justificativa.length < 10) {
    return NextResponse.json({ error: "Justificativa obrigatória (mín. 10 caracteres)." }, { status: 400 });
  }

  await prisma.comprovante.update({ where: { id: params.id }, data: { status: "CANCELADO", justificativa } });

  await logAudit({
    tipo: "COMPROVANTE_CANCELADO",
    entidade: "Comprovante",
    entidadeId: comp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante cancelado — ${comp.condominio.nome} / ${comp.competencia}. Justificativa: ${justificativa}`,
    ip: getIp(req),
  });

  return NextResponse.json({ ok: true });
}
