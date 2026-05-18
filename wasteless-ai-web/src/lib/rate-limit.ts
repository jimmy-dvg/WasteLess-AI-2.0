import "server-only";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __wastelessRateLimit: RateLimitStore | undefined;
}

const rateLimitStore: RateLimitStore = globalThis.__wastelessRateLimit ?? new Map();
if (!globalThis.__wastelessRateLimit) {
  globalThis.__wastelessRateLimit = rateLimitStore;
}

export class RateLimitError extends Error {
  resetAt: number;
  remaining: number;

  constructor(resetAt: number, remaining: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.resetAt = resetAt;
    this.remaining = remaining;
  }
}

export function checkRateLimit(key: string, limit = 4, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function assertRateLimit(key: string, limit = 4, windowMs = 60_000) {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new RateLimitError(result.resetAt, result.remaining);
  }
  return result;
}
