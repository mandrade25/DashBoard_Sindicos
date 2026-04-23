const DEFAULT_SESSION_VERSION = "1";

export function getCurrentSessionVersion() {
  return process.env.AUTH_SESSION_VERSION?.trim() || DEFAULT_SESSION_VERSION;
}
