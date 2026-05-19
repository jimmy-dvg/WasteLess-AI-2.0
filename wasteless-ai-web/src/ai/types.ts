export type AIProviderId =
  | "ollama"
  | "openai"
  | "openrouter"
  | "groq"
  | "huggingface"
  | "gemini"
  | "lmstudio"
  | "together";

export type AIMessageRole = "system" | "user" | "assistant";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
};

export type AIUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AICost = {
  inputCost?: number;
  outputCost?: number;
  totalCost?: number;
  currency?: "USD";
};

export type AITextRequest = {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseType?: "text" | "json";
  jsonSchema?: unknown;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  signal?: AbortSignal | null;
};

export type AITextResponse = {
  provider: AIProviderId;
  model: string;
  outputText: string;
  usage?: AIUsage;
  latencyMs?: number;
  cost?: AICost | null;
  cached?: boolean;
  raw?: unknown;
  requestId?: string;
};

export type AIJsonResponse<T> = AITextResponse & {
  outputJson: T;
};

export type AIStreamEvent =
  | { type: "token"; token: string }
  | { type: "status"; message: string }
  | { type: "done"; response?: AITextResponse }
  | {
      type: "error";
      error: { code: string; message: string; provider?: AIProviderId; retryable?: boolean };
    };

export type AIModelMeta = {
  id: string;
  label: string;
  provider: AIProviderId;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  tags?: string[];
};

export type AIProviderStatus = {
  provider: AIProviderId;
  name: string;
  available: boolean;
  latencyMs?: number;
  models?: AIModelMeta[];
  error?: string | null;
};

export type AIProviderCapabilities = {
  streaming: boolean;
  jsonSchema?: boolean;
  embeddings?: boolean;
};

export type AIEmbeddingRequest = {
  input: string;
  model?: string;
  signal?: AbortSignal | null;
};

export type AIEmbeddingResponse = {
  provider: AIProviderId;
  model: string;
  vector: number[];
  usage?: AIUsage;
  latencyMs?: number;
};

export type AIProvider = {
  id: AIProviderId;
  name: string;
  capabilities: AIProviderCapabilities;
  isAvailable: () => Promise<boolean>;
  listModels?: () => Promise<AIModelMeta[]>;
  generateText: (request: AITextRequest) => Promise<AITextResponse>;
  streamText?: (request: AITextRequest) => AsyncIterable<AIStreamEvent>;
  embedText?: (request: AIEmbeddingRequest) => Promise<AIEmbeddingResponse>;
};

export type AiSettings = {
  provider: AIProviderId;
  model: string;
  enableStreaming: boolean;
};
