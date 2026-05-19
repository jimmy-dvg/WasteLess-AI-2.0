import "server-only";

import type { AIProviderId } from "@/ai/types";
import { aiGateway } from "@/ai/gateway";
import { selectBestModel } from "@/ai/utils/selection";

export type ProviderBenchmarkResult = {
  provider: AIProviderId;
  success: boolean;
  latencyMs?: number;
  error?: string;
};

const BENCHMARK_PROMPT = "Reply with the word OK.";

export async function benchmarkProviders(providerIds?: AIProviderId[]) {
  const statuses = await aiGateway.getProviderStatuses(true);
  const providersToTest = providerIds?.length
    ? providerIds
    : statuses.filter((status) => status.available).map((status) => status.provider);

  const results: ProviderBenchmarkResult[] = [];

  for (const provider of providersToTest) {
    const started = Date.now();
    try {
      await aiGateway.generateText(
        {
          messages: [
            { role: "system", content: "You are a latency test." },
            { role: "user", content: BENCHMARK_PROMPT },
          ],
          maxTokens: 16,
        },
        { providerId: provider, allowFallback: false }
      );

      results.push({ provider, success: true, latencyMs: Date.now() - started });
    } catch (error) {
      results.push({
        provider,
        success: false,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Benchmark failed",
      });
    }
  }

  return results;
}

export function selectBestProvider(results: ProviderBenchmarkResult[]) {
  const successes = results.filter((result) => result.success && result.latencyMs != null);
  if (successes.length === 0) return null;
  return successes.sort((a, b) => (a.latencyMs ?? Infinity) - (b.latencyMs ?? Infinity))[0].provider;
}
export { selectBestModel };
