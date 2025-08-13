/**
 * Returns a persistent, device-specific identifier stored in localStorage.
 * Falls back to generating a new UUID if none exists.
 */
export function getOrCreateDeviceId(): string {
  const storageKey = "terminal_device_id";
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const existing = localStorage.getItem(storageKey);
      if (existing && existing.length > 0) {
        return existing;
      }

      type MaybeUuid = { randomUUID?: () => string };
      let newIdSource: string | undefined;
      if (typeof crypto !== "undefined") {
        const maybeCrypto = crypto as unknown as MaybeUuid;
        if (typeof maybeCrypto.randomUUID === "function") {
          newIdSource = maybeCrypto.randomUUID();
        }
      }

      if (!newIdSource) {
        const ua =
          typeof navigator !== "undefined" ? navigator.userAgent : "ua";
        newIdSource = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${ua}`;
      }

      const newId = newIdSource.replace(/[^a-zA-Z0-9_-]/g, "");

      localStorage.setItem(storageKey, newId);
      return newId;
    }
  } catch {}

  // Non-browser safety fallback
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
