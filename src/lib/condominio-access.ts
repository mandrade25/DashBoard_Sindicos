type AppRole = "ADMIN" | "SINDICO";

type CondominioAccessUser = {
  role: AppRole;
  condominioId?: string | null;
  condominioIds?: string[] | null;
};

export function getAccessibleCondominioIds(user: CondominioAccessUser) {
  if (user.role === "ADMIN") {
    return [];
  }

  return Array.from(
    new Set([
      ...(user.condominioIds ?? []),
      ...(user.condominioId ? [user.condominioId] : []),
    ]),
  );
}

export function hasCondominioAccess(
  user: CondominioAccessUser,
  condominioId: string,
) {
  if (user.role === "ADMIN") {
    return true;
  }

  return getAccessibleCondominioIds(user).includes(condominioId);
}

export function resolveSelectedCondominioId(params: {
  user: CondominioAccessUser;
  requestedCondominioId?: string | null;
  fallbackCondominioIds?: string[];
}) {
  const { user, requestedCondominioId, fallbackCondominioIds = [] } = params;

  if (user.role === "ADMIN") {
    return requestedCondominioId ?? fallbackCondominioIds[0] ?? null;
  }

  const accessibleIds = getAccessibleCondominioIds(user);

  if (
    requestedCondominioId &&
    accessibleIds.includes(requestedCondominioId)
  ) {
    return requestedCondominioId;
  }

  if (user.condominioId && accessibleIds.includes(user.condominioId)) {
    return user.condominioId;
  }

  const firstAvailable = fallbackCondominioIds.find((id) =>
    accessibleIds.includes(id),
  );

  return firstAvailable ?? accessibleIds[0] ?? null;
}
