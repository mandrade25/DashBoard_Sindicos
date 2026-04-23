type RateLimitEntry = {
  count: number;
  firstFailureAt: number;
  blockedUntil: number;
};

type LoginRateLimitContext = {
  ip: string;
  email: string | null;
};

type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 10;
const MAX_FAILURES_PER_IP_EMAIL = 5;

function getRateLimitStore() {
  const globalStore = globalThis as typeof globalThis & {
    __minimerxLoginRateLimitStore?: Map<string, RateLimitEntry>;
  };

  if (!globalStore.__minimerxLoginRateLimitStore) {
    globalStore.__minimerxLoginRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalStore.__minimerxLoginRateLimitStore;
}

function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function buildIpKey(ip: string) {
  return `ip:${ip}`;
}

function buildIpEmailKey(ip: string, email: string) {
  return `ip-email:${ip}:${email}`;
}

function pruneAndGetEntry(store: Map<string, RateLimitEntry>, key: string, now: number) {
  const entry = store.get(key);
  if (!entry) return null;

  const windowExpired = now - entry.firstFailureAt > WINDOW_MS;
  const blockExpired = entry.blockedUntil <= now;

  if (windowExpired && blockExpired) {
    store.delete(key);
    return null;
  }

  return entry;
}

function getRetryAfterSeconds(blockedUntil: number, now: number) {
  return Math.max(1, Math.ceil((blockedUntil - now) / 1000));
}

function evaluateEntry(
  store: Map<string, RateLimitEntry>,
  key: string,
  now: number,
): LoginRateLimitResult {
  const entry = pruneAndGetEntry(store, key, now);
  if (!entry || entry.blockedUntil <= now) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: getRetryAfterSeconds(entry.blockedUntil, now),
  };
}

function registerFailureForKey(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  now: number,
) {
  const current = pruneAndGetEntry(store, key, now);

  if (!current || now - current.firstFailureAt > WINDOW_MS) {
    store.set(key, {
      count: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    });
    return;
  }

  const nextCount = current.count + 1;
  const blockedUntil = nextCount >= limit ? now + BLOCK_MS : current.blockedUntil;

  store.set(key, {
    count: nextCount,
    firstFailureAt: current.firstFailureAt,
    blockedUntil,
  });
}

function clearKey(store: Map<string, RateLimitEntry>, key: string) {
  store.delete(key);
}

export function evaluateLoginRateLimit(context: LoginRateLimitContext): LoginRateLimitResult {
  const store = getRateLimitStore();
  const now = Date.now();

  const ipDecision = evaluateEntry(store, buildIpKey(context.ip), now);
  if (!ipDecision.allowed) return ipDecision;

  const email = normalizeEmail(context.email);
  if (!email) return { allowed: true };

  return evaluateEntry(store, buildIpEmailKey(context.ip, email), now);
}

export function registerLoginFailure(context: LoginRateLimitContext) {
  const store = getRateLimitStore();
  const now = Date.now();

  registerFailureForKey(store, buildIpKey(context.ip), MAX_FAILURES_PER_IP, now);

  const email = normalizeEmail(context.email);
  if (email) {
    registerFailureForKey(store, buildIpEmailKey(context.ip, email), MAX_FAILURES_PER_IP_EMAIL, now);
  }
}

export function clearLoginFailures(context: LoginRateLimitContext) {
  const store = getRateLimitStore();
  clearKey(store, buildIpKey(context.ip));

  const email = normalizeEmail(context.email);
  if (email) {
    clearKey(store, buildIpEmailKey(context.ip, email));
  }
}
