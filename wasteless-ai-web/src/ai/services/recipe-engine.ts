import "server-only";

import { recipeAiResponseSchema, type RecipeAiResponseInput } from "@/validation/recipes";
import { aiGateway } from "@/ai/gateway";
import { recipeResponseJsonSchema } from "@/ai/prompts/recipes";
import type { AIProviderId, AIUsage } from "@/ai/types";
import { parseJsonFromText } from "@/ai/parsers/json";
import { AIProviderError } from "@/ai/utils/errors";

export type RecipeAiResult = {
  data: RecipeAiResponseInput;
  raw: string;
  usage: AIUsage;
  model: string;
  provider: AIProviderId;
  latencyMs?: number;
  cost?: number | null;
};

export async function generateRecipeAiResponse(
  systemPrompt: string,
  userPrompt: string,
  options?: { providerId?: AIProviderId; model?: string; userId?: string }
): Promise<RecipeAiResult> {
  const response = await aiGateway.generateJSON(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: options?.model,
      temperature: 0.3,
      maxTokens: 1400,
      jsonSchema: recipeResponseJsonSchema,
      responseType: "json",
      userId: options?.userId,
    },
    recipeAiResponseSchema,
    { providerId: options?.providerId }
  );

  return {
    data: response.outputJson,
    raw: response.outputText,
    usage: response.usage ?? {},
    model: response.model,
    provider: response.provider,
    latencyMs: response.latencyMs,
    cost: response.cost?.totalCost ?? null,
  };
}

export async function streamRecipeAiResponse(
  systemPrompt: string,
  userPrompt: string,
  options: { providerId?: AIProviderId; model?: string; userId?: string },
  onToken: (token: string) => void
): Promise<RecipeAiResult> {
  const stream = await aiGateway.streamText(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: options.model,
      temperature: 0.3,
      maxTokens: 1400,
      jsonSchema: recipeResponseJsonSchema,
      responseType: "json",
      userId: options.userId,
    },
    { providerId: options.providerId }
  );

  let raw = "";
  let provider: AIProviderId | undefined;
  let model = options.model ?? "";
  let usage: AIUsage = {};

  for await (const event of stream) {
    if (event.type === "token") {
      raw += event.token;
      onToken(event.token);
    }
    if (event.type === "done" && event.response) {
      provider = event.response.provider;
      model = event.response.model;
      usage = event.response.usage ?? {};
      raw = event.response.outputText || raw;
    }
    if (event.type === "error") {
      throw new AIProviderError(event.error.message, {
        code: "invalid_response",
        provider: event.error.provider,
      });
    }
  }

  const parsed = parseJsonFromText(raw);
  const validated = recipeAiResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AIProviderError("AI response did not match expected JSON schema", {
      code: "invalid_response",
      provider,
      details: validated.error.flatten(),
    });
  }

  return {
    data: validated.data,
    raw,
    usage,
    model: model || options.model || "unknown",
    provider: provider ?? options.providerId ?? "ollama",
    latencyMs: undefined,
    cost: null,
  };
}
