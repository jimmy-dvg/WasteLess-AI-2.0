import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { eq } from "drizzle-orm";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { aiSettingsSchema, type AiSettingsInput } from "@/validation/ai";
import { getAIGatewayConfig } from "@/ai/gateway/config";
import type { AiSettings, AIProviderId } from "@/ai/types";

function getDefaultSettings(): AiSettings {
  const config = getAIGatewayConfig();
  const provider = config.defaultProvider;

  const providerDefaults: Record<AIProviderId, string> = {
    ollama: config.providers.ollama.defaultModel,
    openai: config.providers.openai.defaultModel,
    openrouter: config.providers.openrouter.defaultModel,
    groq: config.providers.groq.defaultModel,
    huggingface: config.providers.huggingface.defaultModel,
    gemini: config.providers.gemini.defaultModel,
    lmstudio: config.providers.lmstudio.defaultModel,
    together: config.providers.together.defaultModel,
  };

  return {
    provider,
    model: providerDefaults[provider],
    enableStreaming: true,
  };
}

export async function getAiSettingsForUser(userId: string): Promise<AiSettings> {
  const rows = await db
    .select({ meta: schema.users.meta })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const meta = parseJsonValue<Record<string, unknown>>(rows[0]?.meta ?? {}, {});
  const settingsRaw = meta.ai ?? {};
  const parsed = aiSettingsSchema.safeParse(settingsRaw);
  const defaults = getDefaultSettings();

  if (!parsed.success) return defaults;

  return {
    provider: parsed.data.provider ?? defaults.provider,
    model: parsed.data.model ?? defaults.model,
    enableStreaming: parsed.data.enableStreaming ?? defaults.enableStreaming,
  };
}

export async function updateAiSettingsForUser(userId: string, next: AiSettingsInput): Promise<AiSettings> {
  const parsed = aiSettingsSchema.safeParse(next);
  const defaults = getDefaultSettings();

  if (!parsed.success) return defaults;

  const rows = await db
    .select({ meta: schema.users.meta })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const meta = parseJsonValue<Record<string, unknown>>(rows[0]?.meta ?? {}, {});
  const nextSettings: AiSettings = {
    provider: parsed.data.provider ?? defaults.provider,
    model: parsed.data.model ?? defaults.model,
    enableStreaming: parsed.data.enableStreaming ?? defaults.enableStreaming,
  };

  await db
    .update(schema.users)
    .set({
      meta: {
        ...meta,
        ai: nextSettings,
      },
      updated_at: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return nextSettings;
}
