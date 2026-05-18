import "server-only";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheStore = Map<string, CacheEntry<unknown>>;

declare global {
  // eslint-disable-next-line no-var
  var __wastelessCache: CacheStore | undefined;
}

const cacheStore: CacheStore = globalThis.__wastelessCache ?? new Map();
if (!globalThis.__wastelessCache) {
  globalThis.__wastelessCache = cacheStore;
}

export function getCachedValue<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function deleteCachedValue(key: string) {
  cacheStore.delete(key);
}
