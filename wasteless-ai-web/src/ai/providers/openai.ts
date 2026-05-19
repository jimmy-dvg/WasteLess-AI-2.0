import "server-only";

import type { OpenAICompatibleConfig } from "@/ai/gateway/config";
import { createOpenAICompatibleProvider } from "@/ai/providers/openai-compatible";

export function createOpenAIProvider(config: OpenAICompatibleConfig, timeoutMs: number) {
  return createOpenAICompatibleProvider({
    id: "openai",
    name: "OpenAI",
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    embeddingModel: config.embeddingModel,
    supportsJsonSchema: true,
    timeoutMs,
  });
}
