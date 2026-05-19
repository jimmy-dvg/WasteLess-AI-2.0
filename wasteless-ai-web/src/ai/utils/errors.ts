import type { AIProviderId } from "@/ai/types";

export type AIErrorCode =
  | "provider_unavailable"
  | "invalid_response"
  | "timeout"
  | "rate_limit"
  | "unauthorized"
  | "bad_request"
  | "network"
  | "unknown";

export class AIProviderError extends Error {
  code: AIErrorCode;
  provider?: AIProviderId;
  status?: number;
  retryable?: boolean;
  details?: unknown;

  constructor(
    message: string,
    options: {
      code: AIErrorCode;
      provider?: AIProviderId;
      status?: number;
      retryable?: boolean;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = options.code;
    this.provider = options.provider;
    this.status = options.status;
    this.retryable = options.retryable;
    this.details = options.details;
  }
}

export function toProviderError(error: unknown, provider?: AIProviderId) {
  if (error instanceof AIProviderError) return error;
  if (error instanceof Error) {
    return new AIProviderError(error.message, { code: "unknown", provider });
  }
  return new AIProviderError("Unknown AI provider error", { code: "unknown", provider });
}

export function errorFromHttpStatus(status: number, provider?: AIProviderId, message?: string) {
  if (status === 401 || status === 403) {
    return new AIProviderError(message ?? "Unauthorized", { code: "unauthorized", provider, status });
  }
  if (status === 429) {
    return new AIProviderError(message ?? "Rate limit exceeded", {
      code: "rate_limit",
      provider,
      status,
      retryable: true,
    });
  }
  if (status >= 400 && status < 500) {
    return new AIProviderError(message ?? "Bad request", { code: "bad_request", provider, status });
  }
  if (status >= 500) {
    return new AIProviderError(message ?? "Provider error", { code: "network", provider, status, retryable: true });
  }
  return new AIProviderError(message ?? "Unknown provider error", { code: "unknown", provider, status });
}

export function isRetryableError(error: unknown) {
  if (error instanceof AIProviderError) {
    return Boolean(error.retryable);
  }
  return false;
}

export function isAbortError(error: unknown) {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}
