import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getAccessibleCondominioIds,
  resolveSelectedCondominioId,
} from "@/lib/condominio-access";

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

export async function getSindicoCondominioAccess(condominioId?: string | null) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Não autenticado.", status: 401 as const };
  }

  if (session.user.role !== "SINDICO") {
    return { error: "Proibido.", status: 403 as const };
  }

  const condominioIds = getAccessibleCondominioIds(session.user);
  const resolvedCondominioId = resolveSelectedCondominioId({
    user: session.user,
    requestedCondominioId: condominioId,
  });

  if (!resolvedCondominioId || !condominioIds.includes(resolvedCondominioId)) {
    return { error: "Proibido.", status: 403 as const };
  }

  return { condominioId: resolvedCondominioId, condominioIds };
}
