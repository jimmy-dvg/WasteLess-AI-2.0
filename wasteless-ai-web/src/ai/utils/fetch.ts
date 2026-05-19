export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number
) {
  const controller = new AbortController();
  const existingSignal = init?.signal;

  if (existingSignal) {
    if (existingSignal.aborted) controller.abort();
    existingSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const timeout = timeoutMs && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const mergedInit: RequestInit = {
    ...init,
    signal: controller.signal,
  };

  try {
    return await fetch(input, mergedInit);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
