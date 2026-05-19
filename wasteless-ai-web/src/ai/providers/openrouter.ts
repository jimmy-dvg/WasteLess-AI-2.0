import "server-only";

import type { OpenAICompatibleConfig } from "@/ai/gateway/config";
import { createOpenAICompatibleProvider } from "@/ai/providers/openai-compatible";
import { fetchWithTimeout } from "@/ai/utils/fetch";
import { siteConfig } from "@/lib/constants";

export type OpenRouterConfig = OpenAICompatibleConfig & { freeOnly: boolean; allowedModels: string[] };

export function createOpenRouterProvider(config: OpenRouterConfig, timeoutMs: number) {
  const headers: Record<string, string> = {};
  if (siteConfig?.url) headers["HTTP-Referer"] = siteConfig.url;
  if (siteConfig?.name) headers["X-Title"] = siteConfig.name;

  const provider = createOpenAICompatibleProvider({
    id: "openrouter",
    name: "OpenRouter",
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    embeddingModel: config.embeddingModel,
    supportsJsonSchema: false,
    headers,
    timeoutMs,
  });

  const listModels = async () => {
    if (!config.apiKey) return [];
    const response = await fetchWithTimeout(
      `${config.baseUrl.replace(/\/$/, "")}/models`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          ...headers,
        },
      },
      timeoutMs
    );

    if (!response.ok) return [];
    const data = (await response.json()) as {
      data?: Array<{ id: string; name?: string; pricing?: { prompt?: string; completion?: string } }>;
    };

    let models = (data.data ?? []).map((model) => ({
      id: model.id,
      label: model.name ?? model.id,
      provider: "openrouter" as const,
      tags: model.pricing?.prompt === "0" && model.pricing?.completion === "0" ? ["free"] : [],
    }));

    if (config.freeOnly) {
      models = models.filter((model) => model.tags?.includes("free"));
    }

    if (config.allowedModels.length > 0) {
      models = models.filter((model) => config.allowedModels.includes(model.id));
    }

    return models;
  };

  return { ...provider, listModels };
}
