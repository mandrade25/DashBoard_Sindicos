import nodemailer from "nodemailer";
import { competenciaLabel } from "@/lib/competencia";
import { formatCurrency } from "@/lib/formatters";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface SendComprovanteParams {
  destinatarios: string[];
  condominioNome: string;
  competencia: string;
  faturamento: number;
  valorRepasse: number;
  percentualRepasse: number;
  dataPagamento: string;
  formaPagamento: string;
  observacao?: string | null;
  comprovante: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
}

export interface SendResult {
  enviados: string[];
  falhas: Array<{ email: string; erro: string }>;
}

export async function sendComprovante(params: SendComprovanteParams): Promise<SendResult> {
  const transporter = createTransport();
  const label = competenciaLabel(params.competencia);

  const htmlBody = buildEmailBody({
    condominioNome: params.condominioNome,
    label,
    faturamento: params.faturamento,
    valorRepasse: params.valorRepasse,
    percentualRepasse: params.percentualRepasse,
    dataPagamento: params.dataPagamento,
    formaPagamento: params.formaPagamento,
    observacao: params.observacao,
  });

  const enviados: string[] = [];
  const falhas: Array<{ email: string; erro: string }> = [];

  for (const email of params.destinatarios) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "MiniMerX <noreply@minimerx.com.br>",
        to: email,
        subject: `MiniMerX — Repasse ${label} — ${params.condominioNome}`,
        html: htmlBody,
        attachments: [
          {
            filename: params.comprovante.filename,
            content: params.comprovante.buffer,
            contentType: params.comprovante.mimeType,
          },
        ],
      });
      enviados.push(email);
    } catch (err) {
      falhas.push({
        email,
        erro: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  return { enviados, falhas };
}

function buildEmailBody(p: {
  condominioNome: string;
  label: string;
  faturamento: number;
  valorRepasse: number;
  percentualRepasse: number;
  dataPagamento: string;
  formaPagamento: string;
  observacao?: string | null;
}): string {
  const obs = p.observacao
    ? `<p style="margin:16px 0;padding:12px;background:#f5f7fa;border-radius:6px;font-size:14px;color:#555;">${p.observacao}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1e2a5a;padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;color:#fff;">MiniMerX</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.6);">Prestação de Contas — ${p.label}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;color:#8a94a6;text-transform:uppercase;letter-spacing:.04em;">Condomínio</p>
      <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#1e2a5a;">${p.condominioNome}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Faturamento do período</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#1e2a5a;text-align:right;">${formatCurrency(p.faturamento)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Percentual de repasse</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#1e2a5a;text-align:right;">${p.percentualRepasse}%</td>
        </tr>
        <tr style="background:#f0fdf4;">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;font-weight:600;">Valor do repasse</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:18px;font-weight:700;color:#3dae3c;text-align:right;">${formatCurrency(p.valorRepasse)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Data do pagamento</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;color:#1e2a5a;text-align:right;">${p.dataPagamento}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Forma de pagamento</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;color:#1e2a5a;text-align:right;">${p.formaPagamento}</td>
        </tr>
      </table>
      ${obs}
      <p style="margin:24px 0 0;font-size:13px;color:#8a94a6;">O comprovante bancário do repasse está anexado a este e-mail. Acesse o portal para consultar o histórico completo.</p>
    </div>
    <div style="background:#f5f7fa;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#8a94a6;">MiniMerX · Rede de Mercadinhos Autônomos 24h · by LAVAX</p>
    </div>
  </div>
</body>
</html>`;
}
