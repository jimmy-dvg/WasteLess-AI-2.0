import { z } from "zod";

export const aiProviderSchema = z.enum([
  "ollama",
  "openai",
  "openrouter",
  "groq",
  "huggingface",
  "gemini",
  "lmstudio",
  "together",
]);

export const aiSettingsSchema = z.object({
  provider: aiProviderSchema.optional(),
  model: z.string().trim().min(1).max(120).optional(),
  enableStreaming: z.boolean().optional(),
});

export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;
