import "server-only";

import type { z, ZodTypeAny } from "zod";
import type {
  AIEmbeddingResponse,
  AIJsonResponse,
  AIProvider,
  AIProviderId,
  AIStreamEvent,
  AITextRequest,
  AITextResponse,
} from "@/ai/types";
import { getAIGatewayConfig } from "@/ai/gateway/config";
import { createProviderRegistry } from "@/ai/gateway/registry";
import { ProviderHealthMonitor } from "@/ai/gateway/health";
import { estimateCost, getModelMeta } from "@/ai/gateway/pricing";
import { SemanticCache } from "@/ai/gateway/semantic-cache";
import { parseJsonFromText } from "@/ai/parsers/json";
import { AIProviderError, isAbortError } from "@/ai/utils/errors";
import { withRetry } from "@/ai/utils/retry";
import { withJsonInstruction } from "@/ai/utils/prompt";
import { createSemaphore } from "@/ai/utils/queue";

const LOCAL_PROVIDERS: AIProviderId[] = ["ollama", "lmstudio"];

type GenerateOptions = {
  providerId?: AIProviderId;
  allowFallback?: boolean;
};

type AIGatewayRuntime = {
  config: ReturnType<typeof getAIGatewayConfig>;
  providers: AIProvider[];
  health: ProviderHealthMonitor;
  semaphore: ReturnType<typeof createSemaphore>;
  semanticCache: SemanticCache | null;
};

export class AIGateway {
  private runtime: AIGatewayRuntime | null = null;

  private getRuntime() {
    if (this.runtime) return this.runtime;

    const config = getAIGatewayConfig();
    this.runtime = {
      config,
      providers: createProviderRegistry(config),
      health: new ProviderHealthMonitor(),
      semaphore: createSemaphore(config.maxConcurrency),
      semanticCache: config.enableSemanticCache ? new SemanticCache({ threshold: config.semanticThreshold }) : null,
    };

    return this.runtime;
  }

  private get config() {
    return this.getRuntime().config;
  }

  private get providers() {
    return this.getRuntime().providers;
  }

  private get health() {
    return this.getRuntime().health;
  }

  private get semaphore() {
    return this.getRuntime().semaphore;
  }

  private get semanticCache() {
    return this.getRuntime().semanticCache;
  }

  async generateText(request: AITextRequest, options: GenerateOptions = {}): Promise<AITextResponse> {
    const normalized = this.normalizeRequest(request);

    const cacheKeyPrompt = [
      options.providerId ?? "auto",
      normalized.model ?? "default",
      normalized.messages.map((m) => `${m.role}:${m.content}`).join("\n"),
    ].join("|");
    if (this.semanticCache) {
      const cached = this.semanticCache.get(cacheKeyPrompt);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    const providerChain = await this.resolveProviderChain(options.providerId);
    const modelOwner = this.getRequestedModelOwner(providerChain, options.providerId, normalized);
    const result = await this.runWithFallback(normalized, providerChain, options.allowFallback ?? true, modelOwner);

    const modelMeta = getModelMeta(result.provider, result.model);
    const cost = estimateCost(result.usage, result.provider, modelMeta);
    const withCost = { ...result, cost };

    if (this.semanticCache) {
      this.semanticCache.set(cacheKeyPrompt, withCost);
    }

    return withCost;
  }

  async generateJSON<TSchema extends ZodTypeAny>(
    request: AITextRequest,
    schema: TSchema,
    options: GenerateOptions = {}
  ): Promise<AIJsonResponse<z.output<TSchema>>> {
    const response = await this.generateText({ ...request, responseType: "json" }, options);
    const parsed = parseJsonFromText(response.outputText);
    const validated = schema.safeParse(parsed);

    if (!validated.success) {
      throw new AIProviderError("AI response did not match expected JSON schema", {
        code: "invalid_response",
        provider: response.provider,
        details: validated.error.flatten(),
      });
    }

    return { ...response, outputJson: validated.data };
  }

  async streamText(request: AITextRequest, options: GenerateOptions = {}): Promise<AsyncIterable<AIStreamEvent>> {
    const normalized = this.normalizeRequest(request);
    const providerChain = await this.resolveProviderChain(options.providerId);
    const modelOwner = this.getRequestedModelOwner(providerChain, options.providerId, normalized);
    const provider = await this.pickFirstAvailable(providerChain, (candidate) => Boolean(candidate.streamText));

    if (!provider?.streamText) {
      throw new AIProviderError("Streaming is not supported for this provider", {
        code: "invalid_response",
        provider: provider?.id,
      });
    }

    return provider.streamText(this.requestForProvider(normalized, provider.id, modelOwner));
  }

  async embedText(input: string, options: { providerId?: AIProviderId; model?: string } = {}): Promise<AIEmbeddingResponse> {
    const providerChain = await this.resolveProviderChain(options.providerId);
    const providers = providerChain
      .map((providerId) => this.providers.find((entry) => entry.id === providerId))
      .filter((provider): provider is AIProvider => Boolean(provider && provider.embedText));

    for (const provider of providers) {
      const health = await this.health.check(provider);
      if (!health.available || !provider.embedText) continue;
      try {
        return await provider.embedText({ input, model: options.model });
      } catch {
        continue;
      }
    }

    throw new AIProviderError("No embedding-capable provider available", { code: "provider_unavailable" });
  }

  async getProviderStatuses(force = false) {
    return this.health.getStatuses(this.providers, force);
  }

  async listProviderModels(providerId: AIProviderId) {
    const provider = this.providers.find((entry) => entry.id === providerId);
    if (!provider?.listModels) return [];
    return provider.listModels();
  }

  private normalizeRequest(request: AITextRequest): AITextRequest {
    const responseType = request.responseType ?? "text";
    if (responseType === "json") {
      return {
        ...request,
        responseType,
        messages: withJsonInstruction(request.messages, request.jsonSchema),
      };
    }
    return { ...request, responseType };
  }

  private async resolveProviderChain(preferred?: AIProviderId) {
    const chain = preferred
      ? [preferred, ...this.config.providerChain.filter((entry) => entry !== preferred)]
      : [
          this.config.defaultProvider,
          ...this.config.providerChain.filter((entry) => entry !== this.config.defaultProvider),
        ];
    const ordered = await this.applyStrategy(chain, preferred);
    return ordered;
  }

  private async applyStrategy(chain: AIProviderId[], pinnedProvider?: AIProviderId) {
    let ordered = pinnedProvider ? chain.filter((entry) => entry !== pinnedProvider) : [...chain];

    if (this.config.localFirst) {
      const locals = ordered.filter((entry) => LOCAL_PROVIDERS.includes(entry));
      const remotes = ordered.filter((entry) => !LOCAL_PROVIDERS.includes(entry));
      ordered = [...locals, ...remotes];
    }

    if (this.config.cheapestFirst) {
      ordered = this.sortByCheapest(ordered);
    }

    if (this.config.autoSelectProvider) {
      ordered = await this.sortByHealth(ordered);
    }

    return pinnedProvider ? [pinnedProvider, ...ordered] : ordered;
  }

  private sortByCheapest(chain: AIProviderId[]) {
    return [...chain].sort((a, b) => {
      const providerA = this.providers.find((entry) => entry.id === a);
      const providerB = this.providers.find((entry) => entry.id === b);
      const modelA = providerA ? getModelMeta(providerA.id, this.getDefaultModel(providerA.id)) : undefined;
      const modelB = providerB ? getModelMeta(providerB.id, this.getDefaultModel(providerB.id)) : undefined;

      const costA = modelA?.inputCostPer1k ?? Number.POSITIVE_INFINITY;
      const costB = modelB?.inputCostPer1k ?? Number.POSITIVE_INFINITY;
      return costA - costB;
    });
  }

  private async sortByHealth(chain: AIProviderId[]) {
    const statuses = await this.getProviderStatuses(true);
    const healthMap = new Map(statuses.map((status) => [status.provider, status]));
    return [...chain].sort((a, b) => {
      const statusA = healthMap.get(a);
      const statusB = healthMap.get(b);
      if (statusA?.available && !statusB?.available) return -1;
      if (!statusA?.available && statusB?.available) return 1;
      const latencyA = statusA?.latencyMs ?? Number.POSITIVE_INFINITY;
      const latencyB = statusB?.latencyMs ?? Number.POSITIVE_INFINITY;
      return latencyA - latencyB;
    });
  }

  private getDefaultModel(providerId: AIProviderId) {
    const config = this.config.providers;
    switch (providerId) {
      case "ollama":
        return config.ollama.defaultModel;
      case "openai":
        return config.openai.defaultModel;
      case "openrouter":
        return config.openrouter.defaultModel;
      case "groq":
        return config.groq.defaultModel;
      case "huggingface":
        return config.huggingface.defaultModel;
      case "gemini":
        return config.gemini.defaultModel;
      case "lmstudio":
        return config.lmstudio.defaultModel;
      case "together":
        return config.together.defaultModel;
      default:
        return "";
    }
  }

  private async pickFirstAvailable(chain: AIProviderId[], predicate?: (provider: AIProvider) => boolean) {
    for (const providerId of chain) {
      const provider = this.providers.find((entry) => entry.id === providerId);
      if (!provider) continue;
      if (predicate && !predicate(provider)) continue;
      const health = await this.health.check(provider);
      if (health.available) return provider;
    }
    return null;
  }

  private async runWithFallback(
    request: AITextRequest,
    chain: AIProviderId[],
    allowFallback: boolean,
    modelOwner?: AIProviderId
  ) {
    const providers = chain
      .map((providerId) => this.providers.find((entry) => entry.id === providerId))
      .filter((provider): provider is AIProvider => Boolean(provider));

    if (!allowFallback) {
      const provider = await this.pickFirstAvailable(chain);
      if (!provider) {
        throw new AIProviderError("No providers available", { code: "provider_unavailable" });
      }
      return this.callProvider(provider, this.requestForProvider(request, provider.id, modelOwner));
    }

    if (this.config.concurrentFallback && providers.length > 1) {
      return this.runConcurrentFallback(providers, request, modelOwner);
    }

    const errors: unknown[] = [];
    for (const provider of providers) {
      const health = await this.health.check(provider);
      if (!health.available) continue;
      try {
        return await this.callProvider(provider, this.requestForProvider(request, provider.id, modelOwner));
      } catch (error) {
        errors.push(error);
      }
    }

    throw errors[0] ?? new AIProviderError("All providers failed", { code: "provider_unavailable" });
  }

  private async callProvider(provider: AIProvider, request: AITextRequest) {
    const release = await this.semaphore.acquire();
    try {
      return await withRetry(() => provider.generateText(request), {
        retries: this.config.maxRetries,
        baseDelayMs: 500,
        jitter: true,
        shouldRetry: (error) => isAbortError(error) || (error instanceof AIProviderError && Boolean(error.retryable)),
      });
    } finally {
      release();
    }
  }

  private async runConcurrentFallback(providers: AIProvider[], request: AITextRequest, modelOwner?: AIProviderId) {
    const errors: unknown[] = [];
    let settled = false;

    const tasks = providers.map((provider, index) =>
      new Promise<AITextResponse>((resolve, reject) => {
        const start = () => {
          if (settled) return;
          this.health
            .check(provider)
            .then((health) => {
              if (!health.available) {
                throw new AIProviderError("Provider unavailable", {
                  code: "provider_unavailable",
                  provider: provider.id,
                });
              }
              return this.callProvider(provider, this.requestForProvider(request, provider.id, modelOwner));
            })
            .then((result) => {
              if (settled) return;
              settled = true;
              resolve(result);
            })
            .catch((error) => {
              errors.push(error);
              reject(error);
            });
        };

        const delay = index === 0 ? 0 : this.config.hedgeDelayMs * index;
        setTimeout(start, delay);
      })
    );

    try {
      return await Promise.any(tasks);
    } catch {
      throw errors[0] ?? new AIProviderError("All providers failed", { code: "provider_unavailable" });
    }
  }

  private getRequestedModelOwner(
    chain: AIProviderId[],
    preferredProvider: AIProviderId | undefined,
    request: AITextRequest
  ) {
    if (!request.model) return undefined;
    return preferredProvider ?? chain[0];
  }

  private requestForProvider(request: AITextRequest, providerId: AIProviderId, modelOwner?: AIProviderId) {
    const model = request.model && modelOwner === providerId ? request.model : this.getDefaultModel(providerId);
    return { ...request, model };
  }

}
