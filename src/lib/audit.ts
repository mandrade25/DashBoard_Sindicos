import { prisma } from "@/lib/prisma";

export type AuditTipo =
  | "COMPROVANTE_CRIADO"
  | "COMPROVANTE_SUBSTITUIDO"
  | "COMPROVANTE_CANCELADO"
  | "COMPROVANTE_ATUALIZADO"
  | "COMPROVANTE_BAIXADO"
  | "ENVIO_CRIADO"
  | "ENVIO_REENVIADO"
  | "ENVIO_FALHOU"
  | "DESTINATARIO_CADASTRADO"
  | "DESTINATARIO_REMOVIDO";

export interface AuditParams {
  tipo: AuditTipo;
  entidade: string;
  entidadeId: string;
  usuarioId?: string | null;
  usuarioRole?: string | null;
  descricao: string;
  payload?: Record<string, unknown>;
  ip?: string | null;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tipo: params.tipo,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        usuarioId: params.usuarioId ?? null,
        usuarioRole: params.usuarioRole ?? null,
        descricao: params.descricao,
        payload: params.payload ? JSON.parse(JSON.stringify(params.payload)) : undefined,
        ip: params.ip ?? null,
      },
    });
  } catch {
    console.error("[audit] Falha ao gravar AuditLog:", params);
  }
}

export function getIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}
