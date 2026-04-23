import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { sendComprovante } from "@/lib/email-sender";
import { logAudit, getIp } from "@/lib/audit";
import { competenciaLabel } from "@/lib/competencia";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { id } = await params;
  const envioAnterior = await prisma.envioEmail.findUnique({
    where: { id },
    include: {
      comprovante: true,
      destinatarios: true,
    },
  });

  if (!envioAnterior) return NextResponse.json({ error: "Envio nao encontrado." }, { status: 404 });

  const condominio = await prisma.condominio.findUnique({
    where: { id: envioAnterior.condominioId },
    include: {
      emailsNotificacao: { select: { email: true } },
    },
  });

  if (!condominio) return NextResponse.json({ error: "Condominio nao encontrado." }, { status: 404 });

  const destinatarios = condominio.emailsNotificacao.map((e) => e.email);
  if (destinatarios.length === 0) {
    return NextResponse.json({ error: "Nenhum e-mail de notificacao cadastrado." }, { status: 422 });
  }

  const comp = envioAnterior.comprovante;
  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo do comprovante nao encontrado." }, { status: 500 });

  const [y, m] = comp.competencia.split("-").map(Number);
  const competenciaStart = new Date(`${comp.competencia}-01`);
  const competenciaEnd = m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId: comp.condominioId, data: { gte: competenciaStart, lt: competenciaEnd } },
    _sum: { valorVenda: true },
  });
  const faturamento = Number(vendas._sum.valorVenda ?? 0);

  const formaPagamentoLabel: Record<string, string> = {
    PIX: "PIX",
    TED: "TED",
    DOC: "DOC",
    TRANSFERENCIA_INTERNA: "Transferencia Interna",
    OUTRO: "Outro",
  };

  const result = await sendComprovante({
    destinatarios,
    condominioNome: condominio.nome,
    competencia: comp.competencia,
    faturamento,
    valorRepasse: Number(comp.valorRepasse),
    percentualRepasse: Number(condominio.percentualRepasse),
    dataPagamento: comp.dataPagamento.toISOString().substring(0, 10),
    formaPagamento: formaPagamentoLabel[comp.formaPagamento] ?? comp.formaPagamento,
    observacao: comp.observacao,
    comprovante: { buffer, filename: comp.nomeArquivo, mimeType: comp.mimeType },
  });

  const assunto = `[Reenvio] MiniMerX - Repasse ${competenciaLabel(comp.competencia)} - ${condominio.nome}`;
  const novoEnvio = await prisma.envioEmail.create({
    data: {
      condominioId: comp.condominioId,
      competencia: comp.competencia,
      comprovanteId: comp.id,
      assunto,
      corpo: "Reenvio via sistema - ver log",
      status: result.falhas.length === 0 ? "REENVIADO" : "FALHOU",
      enviadoEm: new Date(),
      criadoPorId: session.user.id,
      reenvioDeId: id,
      destinatarios: {
        create: [
          ...result.enviados.map((email) => ({ email, status: "ENVIADO" as const })),
          ...result.falhas.map(({ email, erro }) => ({ email, status: "FALHOU" as const, erro })),
        ],
      },
    },
  });

  await logAudit({
    tipo: "ENVIO_REENVIADO",
    entidade: "EnvioEmail",
    entidadeId: novoEnvio.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Reenvio de e-mail para ${condominio.nome} - ${comp.competencia}: ${result.enviados.length} ok, ${result.falhas.length} falha(s)`,
    payload: { envioAnteriorId: id, novoEnvioId: novoEnvio.id },
    ip: getIp(req),
  });

  return NextResponse.json({ envioId: novoEnvio.id, enviados: result.enviados, falhas: result.falhas });
}
