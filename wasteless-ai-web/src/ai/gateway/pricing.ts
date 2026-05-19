import type { AICost, AIModelMeta, AIProviderId, AIUsage } from "@/ai/types";
import { DEFAULT_MODELS } from "@/ai/utils/models";

const LOCAL_PROVIDERS = new Set<AIProviderId>(["ollama", "lmstudio"]);

export function getModelMeta(provider: AIProviderId, model: string, models?: AIModelMeta[]) {
  const list = models && models.length ? models : DEFAULT_MODELS;
  return list.find((entry) => entry.provider === provider && entry.id === model);
}

export function estimateCost(usage: AIUsage | undefined, provider: AIProviderId, modelMeta?: AIModelMeta): AICost | null {
  if (!usage) return null;
  if (LOCAL_PROVIDERS.has(provider)) {
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: "USD" };
  }

  const promptTokens = usage.promptTokens ?? 0;
  const completionTokens = usage.completionTokens ?? 0;

  if (!modelMeta?.inputCostPer1k && !modelMeta?.outputCostPer1k) {
    return null;
  }

  const inputCost = modelMeta.inputCostPer1k ? (promptTokens / 1000) * modelMeta.inputCostPer1k : 0;
  const outputCost = modelMeta.outputCostPer1k ? (completionTokens / 1000) * modelMeta.outputCostPer1k : 0;
  const totalCost = inputCost + outputCost;

  return { inputCost, outputCost, totalCost, currency: "USD" };
}
