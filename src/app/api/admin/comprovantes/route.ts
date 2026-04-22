import { NextResponse } from "next/server";
import { z } from "zod";
import { FormaPagamento } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, ALLOWED_MIME_TYPES, MAX_FILE_BYTES, computeHash } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";
import { isValidPastCompetencia, nextMonthStart } from "@/lib/competencia";

const VALOR_TOLERANCIA = 0.02;

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  const competencia = searchParams.get("competencia");

  const items = await prisma.comprovante.findMany({
    where: {
      ...(condominioId ? { condominioId } : {}),
      ...(competencia ? { competencia } : {}),
    },
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
    include: {
      condominio: { select: { nome: true, percentualRepasse: true } },
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
  }

  const arquivo = formData.get("arquivo") as File | null;
  const condominioId = formData.get("condominioId") as string | null;
  const competencia = formData.get("competencia") as string | null;
  const valorRepasseRaw = formData.get("valorRepasse") as string | null;
  const dataPagamento = formData.get("dataPagamento") as string | null;
  const formaPagamentoRaw = formData.get("formaPagamento") as string | null;
  const bancoOrigem = formData.get("bancoOrigem") as string | null;
  const bancoDestino = formData.get("bancoDestino") as string | null;
  const idTransacaoBanco = formData.get("idTransacaoBanco") as string | null;
  const observacao = formData.get("observacao") as string | null;
  const visivelSindico = formData.get("visivelSindico") === "true";
  const confirmarDivergencia = formData.get("confirmarDivergencia") === "true";

  if (!arquivo || !condominioId || !competencia || !valorRepasseRaw || !dataPagamento || !formaPagamentoRaw) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (!isValidPastCompetencia(competencia)) {
    return NextResponse.json({ error: "Competência inválida ou futura." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(arquivo.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json({ error: "Formato não permitido. Use PDF, JPG ou PNG." }, { status: 400 });
  }

  if (arquivo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 10 MB." }, { status: 400 });
  }

  const formaEnum = z.nativeEnum(FormaPagamento).safeParse(formaPagamentoRaw);
  if (!formaEnum.success) {
    return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
  }

  const valorRepasse = parseFloat(valorRepasseRaw);
  if (isNaN(valorRepasse) || valorRepasse <= 0) {
    return NextResponse.json({ error: "Valor de repasse inválido." }, { status: 400 });
  }

  const condominio = await prisma.condominio.findUnique({ where: { id: condominioId } });
  if (!condominio) {
    return NextResponse.json({ error: "Condomínio não encontrado." }, { status: 404 });
  }

  const competenciaStart = new Date(`${competencia}-01`);
  const competenciaEnd = nextMonthStart(competencia);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId, data: { gte: competenciaStart, lt: competenciaEnd } },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);
  const repasseEsperado = faturamento * (Number(condominio.percentualRepasse) / 100);
  const divergencia = Math.abs(valorRepasse - repasseEsperado);
  const temDivergencia = divergencia > VALOR_TOLERANCIA;

  if (temDivergencia && !confirmarDivergencia) {
    return NextResponse.json(
      {
        error: "O valor informado difere do repasse calculado para a competência.",
        requiresConfirmation: true,
        valorInformado: valorRepasse,
        repasseEsperado,
        divergencia,
      },
      { status: 409 },
    );
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const hash = computeHash(buffer);

  const duplicado = await prisma.comprovante.findFirst({
    where: { hashArquivo: hash, condominioId, competencia, status: { not: "CANCELADO" } },
  });
  if (duplicado) {
    return NextResponse.json({ error: "Arquivo idêntico já foi enviado.", comprovanteId: duplicado.id }, { status: 409 });
  }

  const { relativePath } = await saveFile({ condominioId, competencia, filename: arquivo.name, buffer });

  const comprovante = await prisma.comprovante.create({
    data: {
      condominioId,
      competencia,
      nomeArquivo: arquivo.name,
      caminhoArquivo: relativePath,
      mimeType: arquivo.type,
      tamanhoBytes: arquivo.size,
      hashArquivo: hash,
      valorRepasse,
      dataPagamento: new Date(dataPagamento),
      formaPagamento: formaEnum.data,
      bancoOrigem: bancoOrigem || null,
      bancoDestino: bancoDestino || null,
      idTransacaoBanco: idTransacaoBanco || null,
      observacao: observacao || null,
      visivelSindico,
      criadoPorId: session.user.id,
      status: "ANEXADO",
    },
  });

  await logAudit({
    tipo: "COMPROVANTE_CRIADO",
    entidade: "Comprovante",
    entidadeId: comprovante.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante criado para ${condominio.nome} — ${competencia}`,
    payload: { condominioId, competencia, valorRepasse, temDivergencia, divergencia },
    ip: getIp(req),
  });

  return NextResponse.json(
    {
      id: comprovante.id,
      temDivergencia,
      divergencia: temDivergencia ? divergencia : 0,
      repasseEsperado: temDivergencia ? repasseEsperado : Number(valorRepasse.toFixed(2)),
      valorInformado: valorRepasse,
    },
    { status: 201 },
  );
}

// Atualiza visivelSindico para todos os comprovantes de uma competência
export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { condominioId?: string; competencia?: string; visivelSindico?: boolean } | null;
  if (!body?.condominioId || !body?.competencia || typeof body?.visivelSindico !== "boolean") {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const { condominioId, competencia, visivelSindico } = body;

  await prisma.comprovante.updateMany({
    where: { condominioId, competencia, status: { not: "CANCELADO" } },
    data: { visivelSindico },
  });

  await logAudit({
    tipo: "COMPROVANTE_ATUALIZADO",
    entidade: "Comprovante",
    entidadeId: `${condominioId}:${competencia}`,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Visibilidade da competência ${competencia} atualizada para visivelSindico=${visivelSindico}`,
    ip: getIp(req),
  });

  return NextResponse.json({ ok: true });
}
