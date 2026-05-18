import "server-only";

import { recipeAiResponseSchema } from "@/validation/recipes";
import { getOpenAIClient, getOpenAIModel } from "./openai-client";

type OpenAiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

type RecipeAiResult = {
  data: ReturnType<typeof recipeAiResponseSchema.parse>;
  raw: string;
  usage: OpenAiUsage;
  model: string;
};

const recipeResponseJsonSchema = {
  name: "recipe_recommendations",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      recipes: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            servings: { type: "integer" },
            cooking_time_minutes: { type: "integer" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  unit: { type: "string" },
                  notes: { type: "string" },
                  is_optional: { type: "boolean" },
                  is_expiring: { type: "boolean" },
                },
                required: ["name"],
              },
            },
            missing_ingredients: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  unit: { type: "string" },
                  notes: { type: "string" },
                  is_optional: { type: "boolean" },
                  is_expiring: { type: "boolean" },
                },
                required: ["name"],
              },
            },
            steps: { type: "array", items: { type: "string" } },
            waste_reduction_note: { type: "string" },
            nutrition: {
              type: "object",
              additionalProperties: false,
              properties: {
                calories_kcal: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fat_g: { type: "number" },
                fiber_g: { type: "number" },
                sugar_g: { type: "number" },
                sodium_mg: { type: "number" },
              },
              required: ["calories_kcal", "protein_g", "carbs_g", "fat_g"],
            },
            tags: { type: "array", items: { type: "string" } },
          },
          required: [
            "title",
            "description",
            "servings",
            "cooking_time_minutes",
            "difficulty",
            "ingredients",
            "steps",
            "waste_reduction_note",
            "nutrition",
          ],
        },
      },
      summary: { type: "string" },
      pantry_staples: { type: "array", items: { type: "string" } },
    },
    required: ["recipes"],
  },
  strict: true,
};

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractJsonFromText(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return value.slice(start, end + 1);
}

function parseRecipeResponse(raw: string) {
  const direct = safeJsonParse(raw);
  if (direct) return direct;

  const extracted = extractJsonFromText(raw);
  if (!extracted) return null;
  return safeJsonParse(extracted);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateRecipeAiResponse(systemPrompt: string, userPrompt: string): Promise<RecipeAiResult> {
  const client = getOpenAIClient();
  const model = getOpenAIModel();
  const backoff = [500, 1200, 2500];
  let lastError: unknown;

  for (let attempt = 0; attempt < backoff.length + 1; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: recipeResponseJsonSchema,
        },
        temperature: 0.3,
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = parseRecipeResponse(raw);
      const validated = recipeAiResponseSchema.safeParse(parsed);

      if (!validated.success) {
        throw new Error("OpenAI response did not match expected schema");
      }

      const usage = completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens ?? undefined,
            completionTokens: completion.usage.completion_tokens ?? undefined,
            totalTokens: completion.usage.total_tokens ?? undefined,
          }
        : {};

      return {
        data: validated.data,
        raw,
        usage,
        model: completion.model ?? model,
      };
    } catch (error) {
      lastError = error;
      if (attempt < backoff.length) {
        await delay(backoff[attempt]);
        continue;
      }
    }
  }

  throw lastError ?? new Error("OpenAI request failed");
}
