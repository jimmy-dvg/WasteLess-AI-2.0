import "server-only";

import type { AIProviderId } from "@/ai/types";
import { aiEnv } from "@/env/server";
import { AI_PROVIDER_IDS, parseAiProviderChain, parseCsvEnv } from "@/env/schema";

export type OpenAICompatibleConfig = {
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
  embeddingModel?: string;
  supportsJsonSchema?: boolean;
  headers?: Record<string, string>;
};

export type OllamaConfig = {
  baseUrl: string;
  defaultModel: string;
  allowedModels: string[];
  embeddingModel?: string;
};

export type HuggingFaceConfig = {
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
};

export type GeminiConfig = {
  apiKey?: string;
  defaultModel: string;
};

export type AIGatewayConfig = {
  defaultProvider: AIProviderId;
  providerChain: AIProviderId[];
  localFirst: boolean;
  cheapestFirst: boolean;
  autoSelectProvider: boolean;
  concurrentFallback: boolean;
  hedgeDelayMs: number;
  maxRetries: number;
  timeoutMs: number;
  maxConcurrency: number;
  enableSemanticCache: boolean;
  semanticThreshold: number;
  providers: {
    openai: OpenAICompatibleConfig;
    openrouter: OpenAICompatibleConfig & { freeOnly: boolean; allowedModels: string[] };
    groq: OpenAICompatibleConfig;
    together: OpenAICompatibleConfig;
    lmstudio: OpenAICompatibleConfig;
    ollama: OllamaConfig;
    huggingface: HuggingFaceConfig;
    gemini: GeminiConfig;
  };
};

const DEFAULT_PROVIDER_CHAIN: AIProviderId[] = ["ollama", "groq", "openrouter", "openai"];

const DEFAULT_OLLAMA_MODELS = ["llama3", "mistral", "phi3", "deepseek", "gemma"];
function isProviderId(value: string): value is AIProviderId {
  return AI_PROVIDER_IDS.includes(value as AIProviderId);
}

function parseProviderId(value: string | undefined, fallback: AIProviderId) {
  const cleaned = value?.trim();
  return cleaned && isProviderId(cleaned) ? cleaned : fallback;
}

export function getAIGatewayConfig(): AIGatewayConfig {
  const env = aiEnv();
  const defaultProvider = parseProviderId(env.AI_PROVIDER, "ollama");
  const chainFromEnv = parseAiProviderChain(env.AI_PROVIDER_CHAIN);

  return {
    defaultProvider,
    providerChain: chainFromEnv.length ? chainFromEnv : DEFAULT_PROVIDER_CHAIN,
    localFirst: env.AI_LOCAL_FIRST,
    cheapestFirst: env.AI_CHEAPEST_FIRST,
    autoSelectProvider: env.AI_AUTO_SELECT_PROVIDER,
    concurrentFallback: env.AI_CONCURRENT_FALLBACK,
    hedgeDelayMs: env.AI_HEDGE_DELAY_MS,
    maxRetries: env.AI_MAX_RETRIES,
    timeoutMs: env.AI_TIMEOUT_MS,
    maxConcurrency: env.AI_MAX_CONCURRENCY,
    enableSemanticCache: env.AI_SEMANTIC_CACHE,
    semanticThreshold: env.AI_SEMANTIC_THRESHOLD,
    providers: {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        defaultModel: env.OPENAI_MODEL ?? "gpt-4.1-mini",
        embeddingModel: env.OPENAI_EMBEDDING_MODEL,
        supportsJsonSchema: true,
      },
      openrouter: {
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
        defaultModel: env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
        embeddingModel: env.OPENROUTER_EMBEDDING_MODEL,
        supportsJsonSchema: false,
        freeOnly: env.OPENROUTER_FREE_ONLY,
        allowedModels: parseCsvEnv(env.OPENROUTER_ALLOWED_MODELS),
      },
      groq: {
        apiKey: env.GROQ_API_KEY,
        baseUrl: env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
        defaultModel: env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        embeddingModel: env.GROQ_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      together: {
        apiKey: env.TOGETHER_API_KEY,
        baseUrl: env.TOGETHER_BASE_URL ?? "https://api.together.xyz/v1",
        defaultModel: env.TOGETHER_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct-Turbo",
        embeddingModel: env.TOGETHER_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      lmstudio: {
        apiKey: env.LMSTUDIO_API_KEY,
        baseUrl: env.LMSTUDIO_BASE_URL ?? "http://localhost:1234/v1",
        defaultModel: env.LMSTUDIO_MODEL ?? "local-model",
        embeddingModel: env.LMSTUDIO_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      ollama: {
        baseUrl: env.OLLAMA_BASE_URL ?? "http://localhost:11434",
        defaultModel: env.OLLAMA_MODEL ?? "llama3",
        allowedModels: parseCsvEnv(env.OLLAMA_MODELS).length
          ? parseCsvEnv(env.OLLAMA_MODELS)
          : DEFAULT_OLLAMA_MODELS,
        embeddingModel: env.OLLAMA_EMBEDDING_MODEL,
      },
      huggingface: {
        apiKey: env.HUGGINGFACE_API_KEY,
        baseUrl: env.HUGGINGFACE_BASE_URL ?? "https://api-inference.huggingface.co/models",
        defaultModel: env.HUGGINGFACE_MODEL ?? "HuggingFaceH4/zephyr-7b-beta",
      },
      gemini: {
        apiKey: env.GEMINI_API_KEY,
        defaultModel: env.GEMINI_MODEL ?? "gemini-1.5-flash",
      },
    },
  };
}
