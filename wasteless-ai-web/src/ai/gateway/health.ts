import "server-only";

import type { AIProvider, AIProviderId, AIProviderStatus } from "@/ai/types";

type HealthEntry = {
  available: boolean;
  checkedAt: number;
  latencyMs?: number;
  error?: string | null;
};

export class ProviderHealthMonitor {
  private cache = new Map<AIProviderId, HealthEntry>();
  private ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  async check(provider: AIProvider, force = false): Promise<HealthEntry> {
    const existing = this.cache.get(provider.id);
    if (!force && existing && Date.now() - existing.checkedAt < this.ttlMs) {
      return existing;
    }

    const started = Date.now();
    try {
      const available = await provider.isAvailable();
      const entry = {
        available,
        checkedAt: Date.now(),
        latencyMs: Date.now() - started,
        error: null,
      } satisfies HealthEntry;
      this.cache.set(provider.id, entry);
      return entry;
    } catch (error) {
      const entry = {
        available: false,
        checkedAt: Date.now(),
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Unavailable",
      } satisfies HealthEntry;
      this.cache.set(provider.id, entry);
      return entry;
    }
  }

  async getStatuses(providers: AIProvider[], force = false): Promise<AIProviderStatus[]> {
    const statuses: AIProviderStatus[] = [];

    for (const provider of providers) {
      const health = await this.check(provider, force);
      statuses.push({
        provider: provider.id,
        name: provider.name,
        available: health.available,
        latencyMs: health.latencyMs,
        error: health.error,
      });
    }

    return statuses;
  }
}
