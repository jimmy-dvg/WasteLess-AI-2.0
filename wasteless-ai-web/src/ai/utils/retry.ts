import { isRetryableError } from "@/ai/utils/errors";

export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown) => boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const maxDelay = options.maxDelayMs ?? 5_000;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(error)
        : isRetryableError(error);

      if (!shouldRetry || attempt >= options.retries) {
        throw error;
      }

      const baseDelay = Math.min(maxDelay, options.baseDelayMs * Math.pow(2, attempt));
      const delay = options.jitter ? Math.round(baseDelay * (0.7 + Math.random() * 0.6)) : baseDelay;
      await sleep(delay);
    }
  }

  throw new Error("Retry attempts exhausted");
}
