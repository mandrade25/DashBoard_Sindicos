import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { sendComprovante } from "@/lib/email-sender";
import { logAudit, getIp } from "@/lib/audit";
import { competenciaLabel } from "@/lib/competencia";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.comprovanteId) {
    return NextResponse.json({ error: "comprovanteId obrigatório." }, { status: 400 });
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: body.comprovanteId },
    include: {
      condominio: {
        select: {
          nome: true,
          percentualRepasse: true,
          emailsNotificacao: { select: { email: true } },
        },
      },
    },
  });

  if (!comp) return NextResponse.json({ error: "Comprovante não encontrado." }, { status: 404 });
  if (comp.status === "CANCELADO") return NextResponse.json({ error: "Comprovante cancelado." }, { status: 409 });

  const destinatarios = comp.condominio.emailsNotificacao.map((e) => e.email);
  if (destinatarios.length === 0) {
    return NextResponse.json({ error: "Nenhum e-mail de notificação cadastrado para este condomínio." }, { status: 422 });
  }

  // Buscar faturamento do período para incluir no e-mail
  const competenciaStart = new Date(`${comp.competencia}-01`);
  const [y, m] = comp.competencia.split("-").map(Number);
  const competenciaEnd = m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId: comp.condominioId, data: { gte: competenciaStart, lt: competenciaEnd } },
    _sum: { valorVenda: true },
  });
  const faturamento = Number(vendas._sum.valorVenda ?? 0);

  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo do comprovante não encontrado." }, { status: 500 });

  const dataPagamentoStr = comp.dataPagamento.toISOString().substring(0, 10);
  const formaPagamentoLabel: Record<string, string> = {
    PIX: "PIX",
    TED: "TED",
    DOC: "DOC",
    TRANSFERENCIA_INTERNA: "Transferência Interna",
    OUTRO: "Outro",
  };

  const result = await sendComprovante({
    destinatarios,
    condominioNome: comp.condominio.nome,
    competencia: comp.competencia,
    faturamento,
    valorRepasse: Number(comp.valorRepasse),
    percentualRepasse: Number(comp.condominio.percentualRepasse),
    dataPagamento: dataPagamentoStr,
    formaPagamento: formaPagamentoLabel[comp.formaPagamento] ?? comp.formaPagamento,
    observacao: comp.observacao,
    comprovante: { buffer, filename: comp.nomeArquivo, mimeType: comp.mimeType },
  });

  // Criar EnvioEmail e destinatários
  const assunto = `MiniMerX — Repasse ${competenciaLabel(comp.competencia)} — ${comp.condominio.nome}`;
  const envio = await prisma.envioEmail.create({
    data: {
      condominioId: comp.condominioId,
      competencia: comp.competencia,
      comprovanteId: comp.id,
      assunto,
      corpo: "Enviado via sistema — ver log",
      status: result.falhas.length === 0 ? "ENVIADO" : (result.enviados.length === 0 ? "FALHOU" : "ENVIADO"),
      enviadoEm: new Date(),
      criadoPorId: session.user.id,
      destinatarios: {
        create: [
          ...result.enviados.map((email) => ({ email, status: "ENVIADO" as const })),
          ...result.falhas.map(({ email, erro }) => ({ email, status: "FALHOU" as const, erro })),
        ],
      },
    },
  });

  // Atualizar status do comprovante para ENVIADO se todos enviados
  if (result.falhas.length === 0) {
    await prisma.comprovante.update({ where: { id: comp.id }, data: { status: "ENVIADO" } });
  }

  await logAudit({
    tipo: "ENVIO_CRIADO",
    entidade: "EnvioEmail",
    entidadeId: envio.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `E-mail enviado para ${comp.condominio.nome} — ${comp.competencia}: ${result.enviados.length} ok, ${result.falhas.length} falha(s)`,
    payload: { comprovanteId: comp.id, enviados: result.enviados, falhas: result.falhas },
    ip: getIp(req),
  });

  return NextResponse.json({ envioId: envio.id, enviados: result.enviados, falhas: result.falhas });
}
