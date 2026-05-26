import { z, type ZodError } from "zod";

export const AI_PROVIDER_IDS = [
  "ollama",
  "openai",
  "openrouter",
  "groq",
  "huggingface",
  "gemini",
  "lmstudio",
  "together",
] as const;

export type EnvAiProviderId = (typeof AI_PROVIDER_IDS)[number];

const HOSTED_AI_PROVIDER_IDS = [
  "openai",
  "openrouter",
  "groq",
  "huggingface",
  "gemini",
  "together",
] as const satisfies readonly EnvAiProviderId[];

const PLACEHOLDER_VALUES = new Set([
  "...",
  "changeme",
  "change_me",
  "change-me",
  "replace_me",
  "replace-me",
  "replace me",
  "dev_secret",
  "dev-secret",
  "jwt_secret",
  "secret",
  "password",
  "sk-...",
  "your_secret",
  "your_jwt_secret",
  "your_api_key",
]);

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function optionalTrimmedString() {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().optional()
  );
}

function requiredTrimmedString(key: string, message?: string) {
  const errorMessage = message ?? `${key} is required`;
  return z.preprocess(trimString, z.string({ required_error: errorMessage }).min(1, errorMessage));
}

function optionalSecretString(key: string) {
  return optionalTrimmedString().refine(
    (value) => value == null || !isUnsafePlaceholder(value),
    `${key} must not use a placeholder value`
  );
}

function optionalUrlString(key: string) {
  return optionalTrimmedString().refine((value) => value == null || isValidUrl(value), {
    message: `${key} must be a valid URL`,
  });
}

function booleanString(defaultValue: boolean) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim().toLowerCase();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z
      .enum(["true", "false"])
      .default(defaultValue ? "true" : "false")
      .transform((value) => value === "true")
  );
}

function numberString(
  key: string,
  defaultValue: number,
  options: { int?: boolean; min?: number; max?: number } = {}
) {
  let numberSchema: z.ZodNumber = z.number({ invalid_type_error: `${key} must be a number` }).finite();

  if (options.int) numberSchema = numberSchema.int(`${key} must be an integer`);
  if (options.min != null) numberSchema = numberSchema.min(options.min, `${key} must be at least ${options.min}`);
  if (options.max != null) numberSchema = numberSchema.max(options.max, `${key} must be at most ${options.max}`);

  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? Number(trimmed) : undefined;
    },
    numberSchema.default(defaultValue)
  );
}

function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("\n");
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isUnsafePlaceholder(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^["']|["']$/g, "");
  return (
    PLACEHOLDER_VALUES.has(normalized) ||
    normalized.includes("your_") ||
    normalized.includes("<") ||
    normalized.includes(">")
  );
}

function hasUsableValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0 && !isUnsafePlaceholder(value);
}

export function parseCsvEnv(value?: string) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAiProviderId(value: string): value is EnvAiProviderId {
  return AI_PROVIDER_IDS.includes(value as EnvAiProviderId);
}

export function parseAiProviderChain(value?: string) {
  return parseCsvEnv(value).filter(isAiProviderId);
}

function requireProviderKey(
  provider: EnvAiProviderId | undefined,
  env: z.infer<typeof aiEnvBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (!provider) return;

  const providerKey = {
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    groq: "GROQ_API_KEY",
    huggingface: "HUGGINGFACE_API_KEY",
    gemini: "GEMINI_API_KEY",
    together: "TOGETHER_API_KEY",
    ollama: null,
    lmstudio: null,
  }[provider] as keyof typeof env | null;

  if (providerKey && !hasUsableValue(env[providerKey] as string | undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [providerKey],
      message: `${providerKey} is required because AI_PROVIDER is set to ${provider}`,
    });
  }
}

function hasHostedAiKey(env: z.infer<typeof aiEnvBaseSchema>) {
  const keyByProvider: Record<(typeof HOSTED_AI_PROVIDER_IDS)[number], keyof typeof env> = {
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    groq: "GROQ_API_KEY",
    huggingface: "HUGGINGFACE_API_KEY",
    gemini: "GEMINI_API_KEY",
    together: "TOGETHER_API_KEY",
  };

  return HOSTED_AI_PROVIDER_IDS.some((provider) => hasUsableValue(env[keyByProvider[provider]] as string | undefined));
}

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const aiProviderSchema = z.enum(AI_PROVIDER_IDS);
const photoRecognitionProviderSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim().toLowerCase() : undefined),
  z.enum(["auto", "openai", "gemini"]).default("auto")
);

const aiEnvBaseSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  AI_PROVIDER: optionalTrimmedString().refine(
    (value) => value == null || isAiProviderId(value),
    `AI_PROVIDER must be one of: ${AI_PROVIDER_IDS.join(", ")}`
  ),
  AI_PROVIDER_CHAIN: optionalTrimmedString().superRefine((value, ctx) => {
    const invalid = parseCsvEnv(value).filter((entry) => !isAiProviderId(entry));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `AI_PROVIDER_CHAIN contains unsupported provider(s): ${invalid.join(", ")}`,
      });
    }
  }),
  AI_LOCAL_FIRST: booleanString(true),
  AI_CHEAPEST_FIRST: booleanString(false),
  AI_AUTO_SELECT_PROVIDER: booleanString(false),
  AI_CONCURRENT_FALLBACK: booleanString(true),
  AI_HEDGE_DELAY_MS: numberString("AI_HEDGE_DELAY_MS", 1200, { int: true, min: 0, max: 60_000 }),
  AI_MAX_RETRIES: numberString("AI_MAX_RETRIES", 2, { int: true, min: 0, max: 10 }),
  AI_TIMEOUT_MS: numberString("AI_TIMEOUT_MS", 30_000, { int: true, min: 1_000, max: 120_000 }),
  AI_MAX_CONCURRENCY: numberString("AI_MAX_CONCURRENCY", 4, { int: true, min: 1, max: 25 }),
  AI_SEMANTIC_CACHE: booleanString(false),
  AI_SEMANTIC_THRESHOLD: numberString("AI_SEMANTIC_THRESHOLD", 0.88, { min: 0, max: 1 }),

  OPENAI_API_KEY: optionalSecretString("OPENAI_API_KEY"),
  OPENAI_MODEL: optionalTrimmedString(),
  OPENAI_VISION_MODEL: optionalTrimmedString(),
  OPENAI_BASE_URL: optionalUrlString("OPENAI_BASE_URL"),
  OPENAI_EMBEDDING_MODEL: optionalTrimmedString(),

  OPENROUTER_API_KEY: optionalSecretString("OPENROUTER_API_KEY"),
  OPENROUTER_MODEL: optionalTrimmedString(),
  OPENROUTER_BASE_URL: optionalUrlString("OPENROUTER_BASE_URL"),
  OPENROUTER_ALLOWED_MODELS: optionalTrimmedString(),
  OPENROUTER_FREE_ONLY: booleanString(true),
  OPENROUTER_EMBEDDING_MODEL: optionalTrimmedString(),

  GROQ_API_KEY: optionalSecretString("GROQ_API_KEY"),
  GROQ_MODEL: optionalTrimmedString(),
  GROQ_BASE_URL: optionalUrlString("GROQ_BASE_URL"),
  GROQ_EMBEDDING_MODEL: optionalTrimmedString(),

  HUGGINGFACE_API_KEY: optionalSecretString("HUGGINGFACE_API_KEY"),
  HUGGINGFACE_MODEL: optionalTrimmedString(),
  HUGGINGFACE_BASE_URL: optionalUrlString("HUGGINGFACE_BASE_URL"),

  GEMINI_API_KEY: optionalSecretString("GEMINI_API_KEY"),
  GEMINI_MODEL: optionalTrimmedString(),
  GEMINI_VISION_MODEL: optionalTrimmedString(),
  GEMINI_VISION_MODEL_CHAIN: optionalTrimmedString(),

  LMSTUDIO_BASE_URL: optionalUrlString("LMSTUDIO_BASE_URL"),
  LMSTUDIO_MODEL: optionalTrimmedString(),
  LMSTUDIO_API_KEY: optionalSecretString("LMSTUDIO_API_KEY"),
  LMSTUDIO_EMBEDDING_MODEL: optionalTrimmedString(),

  OLLAMA_BASE_URL: optionalUrlString("OLLAMA_BASE_URL"),
  OLLAMA_MODEL: optionalTrimmedString(),
  OLLAMA_MODELS: optionalTrimmedString(),
  OLLAMA_EMBEDDING_MODEL: optionalTrimmedString(),

  TOGETHER_API_KEY: optionalSecretString("TOGETHER_API_KEY"),
  TOGETHER_MODEL: optionalTrimmedString(),
  TOGETHER_BASE_URL: optionalUrlString("TOGETHER_BASE_URL"),
  TOGETHER_EMBEDDING_MODEL: optionalTrimmedString(),

  PHOTO_RECOGNITION_PROVIDER: photoRecognitionProviderSchema,
});

export function parseEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  env: NodeJS.ProcessEnv,
  options?: { scope?: string }
): z.infer<TSchema> {
  const parsed = schema.safeParse(env);
  if (parsed.success) return parsed.data;

  const scope = options?.scope ? ` (${options.scope})` : "";
  throw new Error(`Invalid environment variables${scope}:\n${formatZodError(parsed.error)}`);
}

export const databaseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: requiredTrimmedString(
    "DATABASE_URL",
    "DATABASE_URL is required (PostgreSQL connection string)"
  ).refine((value) => /^postgres(?:ql)?:\/\//i.test(value), {
    message: "DATABASE_URL must be a PostgreSQL connection string",
  }),
});

export const authEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema,
    JWT_SECRET: requiredTrimmedString(
      "JWT_SECRET",
      "JWT_SECRET is required for session token signing and verification"
    ),
  })
  .superRefine((env, ctx) => {
    if (isUnsafePlaceholder(env.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must not use a placeholder value",
      });
    }

    if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be at least 32 characters in production",
      });
    }
  });

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  API_CORS_ORIGIN: optionalUrlString("API_CORS_ORIGIN"),
});

export const appEnvSchema = z.object({
  APP_URL: optionalUrlString("APP_URL"),
  NEXT_PUBLIC_APP_URL: optionalUrlString("NEXT_PUBLIC_APP_URL"),
  VERCEL_URL: optionalTrimmedString(),
});

export const storageEnvSchema = z
  .object({
    CLOUDINARY_CLOUD_NAME: optionalTrimmedString(),
    CLOUDINARY_API_KEY: optionalSecretString("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: optionalSecretString("CLOUDINARY_API_SECRET"),
    CLOUDINARY_RECEIPT_FOLDER: optionalTrimmedString(),
  })
  .superRefine((env, ctx) => {
    const cloudinaryValues = [
      env.CLOUDINARY_CLOUD_NAME,
      env.CLOUDINARY_API_KEY,
      env.CLOUDINARY_API_SECRET,
    ].filter(Boolean);

    if (cloudinaryValues.length > 0 && cloudinaryValues.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLOUDINARY_CLOUD_NAME"],
        message: "Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET together",
      });
    }
  });

export const scannerEnvSchema = z.object({
  USDA_FDC_API_KEY: optionalSecretString("USDA_FDC_API_KEY"),
  BARCODE_LOOKUP_API_KEY: optionalSecretString("BARCODE_LOOKUP_API_KEY"),
});

export const notificationEnvSchema = z.object({
  NOTIFICATIONS_CRON_SECRET: optionalSecretString("NOTIFICATIONS_CRON_SECRET"),
  CRON_SECRET: optionalSecretString("CRON_SECRET"),
});

export const aiEnvSchema = aiEnvBaseSchema.superRefine((env, ctx) => {
  const selectedProvider = env.AI_PROVIDER && aiProviderSchema.safeParse(env.AI_PROVIDER).success
    ? (env.AI_PROVIDER as EnvAiProviderId)
    : undefined;

  requireProviderKey(selectedProvider, env, ctx);

  if (env.PHOTO_RECOGNITION_PROVIDER === "openai" && !hasUsableValue(env.OPENAI_API_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["OPENAI_API_KEY"],
      message: "OPENAI_API_KEY is required when PHOTO_RECOGNITION_PROVIDER is openai",
    });
  }

  if (env.PHOTO_RECOGNITION_PROVIDER === "gemini" && !hasUsableValue(env.GEMINI_API_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["GEMINI_API_KEY"],
      message: "GEMINI_API_KEY is required when PHOTO_RECOGNITION_PROVIDER is gemini",
    });
  }

  if (env.NODE_ENV !== "production") return;

  if (!hasHostedAiKey(env)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["AI_PROVIDER_CHAIN"],
      message:
        "Production AI requires at least one hosted provider API key (OPENAI, OPENROUTER, GROQ, HUGGINGFACE, GEMINI, or TOGETHER)",
    });
  }

  if (!hasUsableValue(env.OPENAI_API_KEY) && !hasUsableValue(env.GEMINI_API_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["PHOTO_RECOGNITION_PROVIDER"],
      message: "Production photo recognition requires OPENAI_API_KEY or GEMINI_API_KEY",
    });
  }
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type AppEnv = z.infer<typeof appEnvSchema>;
export type AiEnv = z.infer<typeof aiEnvSchema>;
export type StorageEnv = z.infer<typeof storageEnvSchema>;
export type ScannerEnv = z.infer<typeof scannerEnvSchema>;
export type NotificationEnv = z.infer<typeof notificationEnvSchema>;
