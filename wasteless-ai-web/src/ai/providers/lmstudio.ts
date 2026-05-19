import "server-only";

import type { OpenAICompatibleConfig } from "@/ai/gateway/config";
import { createOpenAICompatibleProvider } from "@/ai/providers/openai-compatible";

export function createLmStudioProvider(config: OpenAICompatibleConfig, timeoutMs: number) {
  return createOpenAICompatibleProvider({
    id: "lmstudio",
    name: "LM Studio",
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    embeddingModel: config.embeddingModel,
    supportsJsonSchema: false,
    timeoutMs,
  });
}
