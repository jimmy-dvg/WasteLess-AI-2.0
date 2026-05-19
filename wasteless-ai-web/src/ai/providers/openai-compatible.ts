import "server-only";

import type { AIEmbeddingResponse, AIProvider, AIStreamEvent, AITextRequest, AITextResponse } from "@/ai/types";
import { AIProviderError, errorFromHttpStatus } from "@/ai/utils/errors";
import { fetchWithTimeout } from "@/ai/utils/fetch";
import { streamSse } from "@/ai/utils/stream";

export type OpenAICompatibleProviderOptions = {
  id: AIProvider["id"];
  name: string;
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
  embeddingModel?: string;
  supportsJsonSchema?: boolean;
  headers?: Record<string, string>;
  timeoutMs: number;
};

export function createOpenAICompatibleProvider(options: OpenAICompatibleProviderOptions): AIProvider {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  const buildHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (options.apiKey) {
      headers.Authorization = `Bearer ${options.apiKey}`;
    }
    return headers;
  };

  const generateText = async (request: AITextRequest): Promise<AITextResponse> => {
    const started = Date.now();
    const model = request.model ?? options.defaultModel;

    const payload: Record<string, unknown> = {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1200,
      top_p: request.topP,
      stream: false,
    };

    if (request.responseType === "json" && options.supportsJsonSchema && request.jsonSchema) {
      payload.response_format = { type: "json_schema", json_schema: request.jsonSchema };
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
        signal: request.signal ?? undefined,
      },
      options.timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, options.id, message);
    }

    const data = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      provider: options.id,
      model: data.model ?? model,
      outputText: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? undefined,
            completionTokens: data.usage.completion_tokens ?? undefined,
            totalTokens: data.usage.total_tokens ?? undefined,
          }
        : undefined,
      latencyMs: Date.now() - started,
      raw: data,
      requestId: request.requestId,
    };
  };

  const streamText = async function* (request: AITextRequest): AsyncGenerator<AIStreamEvent, void, unknown> {
    const model = request.model ?? options.defaultModel;
    const payload: Record<string, unknown> = {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1200,
      top_p: request.topP,
      stream: true,
    };

    if (request.responseType === "json" && options.supportsJsonSchema && request.jsonSchema) {
      payload.response_format = { type: "json_schema", json_schema: request.jsonSchema };
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
        signal: request.signal ?? undefined,
      },
      options.timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, options.id, message);
    }

    let output = "";
    let finalUsage: AITextResponse["usage"] | undefined;

    for await (const event of streamSse(response)) {
      if (event.data === "[DONE]") break;
      const parsed = safeJsonParse(event.data) as {
        model?: string;
        choices?: Array<{ delta?: { content?: string } }>; 
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      } | null;

      if (!parsed) continue;

      const token = parsed.choices?.[0]?.delta?.content;
      if (token) {
        output += token;
        yield { type: "token", token };
      }

      if (parsed.usage) {
        finalUsage = {
          promptTokens: parsed.usage.prompt_tokens ?? undefined,
          completionTokens: parsed.usage.completion_tokens ?? undefined,
          totalTokens: parsed.usage.total_tokens ?? undefined,
        };
      }
    }

    yield {
      type: "done",
      response: {
        provider: options.id,
        model,
        outputText: output,
        usage: finalUsage,
        requestId: request.requestId,
      },
    };
  };

  const listModels = async () => {
    if (!options.apiKey && options.id !== "lmstudio") return [];
    const response = await fetchWithTimeout(
      `${baseUrl}/models`,
      { headers: buildHeaders(), signal: undefined },
      options.timeoutMs
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { data?: Array<{ id: string }> };
    return (data.data ?? []).map((model) => ({
      id: model.id,
      label: model.id,
      provider: options.id,
    }));
  };

  const embedText = async (request: { input: string; model?: string; signal?: AbortSignal | null }): Promise<AIEmbeddingResponse> => {
    const started = Date.now();
    const model = request.model ?? options.embeddingModel;
    if (!model) {
      throw new AIProviderError("Embedding model is not configured", {
        code: "bad_request",
        provider: options.id,
      });
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/embeddings`,
      {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ model, input: request.input }),
        signal: request.signal ?? undefined,
      },
      options.timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, options.id, message);
    }

    const data = (await response.json()) as {
      model?: string;
      data?: Array<{ embedding?: number[] }>;
      usage?: { prompt_tokens?: number; total_tokens?: number };
    };

    return {
      provider: options.id,
      model: data.model ?? model,
      vector: data.data?.[0]?.embedding ?? [],
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? undefined,
            totalTokens: data.usage.total_tokens ?? undefined,
          }
        : undefined,
      latencyMs: Date.now() - started,
    };
  };

  return {
    id: options.id,
    name: options.name,
    capabilities: {
      streaming: true,
      jsonSchema: Boolean(options.supportsJsonSchema),
      embeddings: Boolean(options.embeddingModel),
    },
    isAvailable: async () => {
      if (options.apiKey === undefined && options.id !== "lmstudio") return false;
      try {
        const response = await fetchWithTimeout(
          `${baseUrl}/models`,
          { headers: buildHeaders(), signal: undefined },
          options.timeoutMs
        );
        return response.ok;
      } catch {
        return false;
      }
    },
    listModels,
    generateText,
    streamText,
    embedText,
  };
}

async function safeErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data?.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
