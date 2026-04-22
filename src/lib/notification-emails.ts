import { z } from "zod";
import { auth } from "@/lib/auth";

export const notificationEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe um e-mail.")
    .max(320, "Informe um e-mail válido.")
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
});

export type NotificationEmailPayload = z.infer<typeof notificationEmailSchema>;

export type NotificationEmailItem = {
  id: string;
  email: string;
  criadoEm: string;
  atualizadoEm: string;
};

export const notificationEmailSelect = {
  id: true,
  email: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export function normalizeNotificationEmail(email: string) {
  return email.trim().toLowerCase();
}

function mergeCondominioIds(condominioIds: string[] | undefined, condominioId: string | null) {
  return Array.from(new Set([...(condominioIds ?? []), ...(condominioId ? [condominioId] : [])]));
}

export async function getSindicoCondominioAccess(condominioId?: string | null) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Não autenticado.", status: 401 as const };
  }

  if (session.user.role !== "SINDICO") {
    return { error: "Proibido.", status: 403 as const };
  }

  const condominioIds = mergeCondominioIds(
    session.user.condominioIds,
    session.user.condominioId,
  );
  const resolvedCondominioId =
    condominioId ?? session.user.condominioId ?? condominioIds[0] ?? null;

  if (!resolvedCondominioId || !condominioIds.includes(resolvedCondominioId)) {
    return { error: "Proibido.", status: 403 as const };
  }

  return { condominioId: resolvedCondominioId, condominioIds };
}
