import "server-only";

import type { OpenAICompatibleConfig } from "@/ai/gateway/config";
import { createOpenAICompatibleProvider } from "@/ai/providers/openai-compatible";

export function createTogetherProvider(config: OpenAICompatibleConfig, timeoutMs: number) {
  return createOpenAICompatibleProvider({
    id: "together",
    name: "Together AI",
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    embeddingModel: config.embeddingModel,
    supportsJsonSchema: false,
    timeoutMs,
  });
}
