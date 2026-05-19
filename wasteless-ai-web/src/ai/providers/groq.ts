import "server-only";

import type { OpenAICompatibleConfig } from "@/ai/gateway/config";
import { createOpenAICompatibleProvider } from "@/ai/providers/openai-compatible";

export function createGroqProvider(config: OpenAICompatibleConfig, timeoutMs: number) {
  return createOpenAICompatibleProvider({
    id: "groq",
    name: "Groq",
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    embeddingModel: config.embeddingModel,
    supportsJsonSchema: false,
    timeoutMs,
  });
}
