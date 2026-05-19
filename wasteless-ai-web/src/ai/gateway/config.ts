import "server-only";

import type { AIProviderId } from "@/ai/types";

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
const AI_PROVIDER_IDS: AIProviderId[] = [
  "ollama",
  "openai",
  "openrouter",
  "groq",
  "huggingface",
  "gemini",
  "lmstudio",
  "together",
];

function parseCsv(value?: string) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function envNumber(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  return value.toLowerCase() === "true";
}

function cleanEnv(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isProviderId(value: string): value is AIProviderId {
  return AI_PROVIDER_IDS.includes(value as AIProviderId);
}

function parseProviderId(value: string | undefined, fallback: AIProviderId) {
  const cleaned = cleanEnv(value);
  return cleaned && isProviderId(cleaned) ? cleaned : fallback;
}

function parseProviderChain(value: string | undefined) {
  return parseCsv(value).filter(isProviderId);
}

export function getAIGatewayConfig(): AIGatewayConfig {
  const defaultProvider = parseProviderId(process.env.AI_PROVIDER, "ollama");
  const chainFromEnv = parseProviderChain(process.env.AI_PROVIDER_CHAIN);

  return {
    defaultProvider,
    providerChain: chainFromEnv.length ? chainFromEnv : DEFAULT_PROVIDER_CHAIN,
    localFirst: envBoolean(process.env.AI_LOCAL_FIRST, true),
    cheapestFirst: envBoolean(process.env.AI_CHEAPEST_FIRST, false),
    autoSelectProvider: envBoolean(process.env.AI_AUTO_SELECT_PROVIDER, false),
    concurrentFallback: envBoolean(process.env.AI_CONCURRENT_FALLBACK, true),
    hedgeDelayMs: envNumber(process.env.AI_HEDGE_DELAY_MS, 1200),
    maxRetries: envNumber(process.env.AI_MAX_RETRIES, 2),
    timeoutMs: envNumber(process.env.AI_TIMEOUT_MS, 30_000),
    maxConcurrency: envNumber(process.env.AI_MAX_CONCURRENCY, 4),
    enableSemanticCache: envBoolean(process.env.AI_SEMANTIC_CACHE, false),
    semanticThreshold: envNumber(process.env.AI_SEMANTIC_THRESHOLD, 0.88),
    providers: {
      openai: {
        apiKey: cleanEnv(process.env.OPENAI_API_KEY),
        baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        defaultModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
        supportsJsonSchema: true,
      },
      openrouter: {
        apiKey: cleanEnv(process.env.OPENROUTER_API_KEY),
        baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
        defaultModel: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
        embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL,
        supportsJsonSchema: false,
        freeOnly: envBoolean(process.env.OPENROUTER_FREE_ONLY, true),
        allowedModels: parseCsv(process.env.OPENROUTER_ALLOWED_MODELS),
      },
      groq: {
        apiKey: cleanEnv(process.env.GROQ_API_KEY),
        baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
        defaultModel: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        embeddingModel: process.env.GROQ_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      together: {
        apiKey: cleanEnv(process.env.TOGETHER_API_KEY),
        baseUrl: process.env.TOGETHER_BASE_URL ?? "https://api.together.xyz/v1",
        defaultModel: process.env.TOGETHER_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct-Turbo",
        embeddingModel: process.env.TOGETHER_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      lmstudio: {
        apiKey: cleanEnv(process.env.LMSTUDIO_API_KEY),
        baseUrl: process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234/v1",
        defaultModel: process.env.LMSTUDIO_MODEL ?? "local-model",
        embeddingModel: process.env.LMSTUDIO_EMBEDDING_MODEL,
        supportsJsonSchema: false,
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
        defaultModel: process.env.OLLAMA_MODEL ?? "llama3",
        allowedModels: parseCsv(process.env.OLLAMA_MODELS).length
          ? parseCsv(process.env.OLLAMA_MODELS)
          : DEFAULT_OLLAMA_MODELS,
        embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL,
      },
      huggingface: {
        apiKey: cleanEnv(process.env.HUGGINGFACE_API_KEY),
        baseUrl: process.env.HUGGINGFACE_BASE_URL ?? "https://api-inference.huggingface.co/models",
        defaultModel: process.env.HUGGINGFACE_MODEL ?? "HuggingFaceH4/zephyr-7b-beta",
      },
      gemini: {
        apiKey: cleanEnv(process.env.GEMINI_API_KEY),
        defaultModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
      },
    },
  };
}
