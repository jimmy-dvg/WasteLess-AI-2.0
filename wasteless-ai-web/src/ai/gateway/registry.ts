import "server-only";

import type { AIProvider } from "@/ai/types";
import type { AIGatewayConfig } from "@/ai/gateway/config";
import { createGroqProvider } from "@/ai/providers/groq";
import { createHuggingFaceProvider } from "@/ai/providers/huggingface";
import { createLmStudioProvider } from "@/ai/providers/lmstudio";
import { createOllamaProvider } from "@/ai/providers/ollama";
import { createOpenAIProvider } from "@/ai/providers/openai";
import { createOpenRouterProvider } from "@/ai/providers/openrouter";
import { createTogetherProvider } from "@/ai/providers/together";
import { createGeminiProvider } from "@/ai/providers/gemini";

export function createProviderRegistry(config: AIGatewayConfig): AIProvider[] {
  const timeoutMs = config.timeoutMs;

  return [
    createOllamaProvider(config.providers.ollama, timeoutMs),
    createGroqProvider(config.providers.groq, timeoutMs),
    createOpenRouterProvider(config.providers.openrouter, timeoutMs),
    createOpenAIProvider(config.providers.openai, timeoutMs),
    createHuggingFaceProvider(config.providers.huggingface, timeoutMs),
    createGeminiProvider(config.providers.gemini, timeoutMs),
    createLmStudioProvider(config.providers.lmstudio, timeoutMs),
    createTogetherProvider(config.providers.together, timeoutMs),
  ];
}
