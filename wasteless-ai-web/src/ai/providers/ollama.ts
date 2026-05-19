import "server-only";

import type { AIEmbeddingResponse, AIProvider, AIStreamEvent, AITextRequest, AITextResponse } from "@/ai/types";
import { errorFromHttpStatus } from "@/ai/utils/errors";
import { fetchWithTimeout } from "@/ai/utils/fetch";
import { streamJsonLines } from "@/ai/utils/stream";

export type OllamaProviderConfig = {
  baseUrl: string;
  defaultModel: string;
  allowedModels: string[];
  embeddingModel?: string;
};

export function createOllamaProvider(config: OllamaProviderConfig, timeoutMs: number): AIProvider {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const generateText = async (request: AITextRequest): Promise<AITextResponse> => {
    const started = Date.now();
    const model = request.model ?? config.defaultModel;

    const payload: Record<string, unknown> = {
      model,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: request.maxTokens ?? 1200,
      },
    };

    if (request.responseType === "json") {
      payload.format = "json";
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: request.signal ?? undefined,
      },
      timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, "ollama", message);
    }

    const data = (await response.json()) as {
      model?: string;
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const promptTokens = data.prompt_eval_count ?? undefined;
    const completionTokens = data.eval_count ?? undefined;

    return {
      provider: "ollama",
      model: data.model ?? model,
      outputText: data.message?.content ?? "",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens != null && completionTokens != null ? promptTokens + completionTokens : undefined,
      },
      latencyMs: Date.now() - started,
      raw: data,
      requestId: request.requestId,
    };
  };

  const streamText = async function* (request: AITextRequest): AsyncGenerator<AIStreamEvent, void, unknown> {
    const model = request.model ?? config.defaultModel;
    const payload: Record<string, unknown> = {
      model,
      messages: request.messages,
      stream: true,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: request.maxTokens ?? 1200,
      },
    };

    if (request.responseType === "json") {
      payload.format = "json";
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: request.signal ?? undefined,
      },
      timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, "ollama", message);
    }

    let output = "";

    for await (const line of streamJsonLines(response)) {
      const parsed = safeJsonParse(line) as { message?: { content?: string }; done?: boolean } | null;
      if (!parsed) continue;
      if (parsed.done) break;
      const token = parsed.message?.content;
      if (token) {
        output += token;
        yield { type: "token", token };
      }
    }

    yield {
      type: "done",
      response: {
        provider: "ollama",
        model,
        outputText: output,
        requestId: request.requestId,
      },
    };
  };

  const listModels = async () => {
    const response = await fetchWithTimeout(`${baseUrl}/api/tags`, { method: "GET" }, timeoutMs);
    if (!response.ok) return [];
    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((model) => ({
      id: model.name,
      label: model.name,
      provider: "ollama" as const,
      tags: ["local", "free"],
    }));
    if (config.allowedModels.length === 0) return models;
    return models.filter((model) => config.allowedModels.includes(model.id));
  };

  const embedText = async (request: { input: string; model?: string; signal?: AbortSignal | null }): Promise<AIEmbeddingResponse> => {
    const started = Date.now();
    const model = request.model ?? config.embeddingModel ?? config.defaultModel;

    const response = await fetchWithTimeout(
      `${baseUrl}/api/embeddings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: request.input }),
        signal: request.signal ?? undefined,
      },
      timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, "ollama", message);
    }

    const data = (await response.json()) as { embedding?: number[] };
    return {
      provider: "ollama",
      model,
      vector: data.embedding ?? [],
      latencyMs: Date.now() - started,
    };
  };

  return {
    id: "ollama",
    name: "Ollama",
    capabilities: { streaming: true, jsonSchema: false, embeddings: true },
    isAvailable: async () => {
      try {
        const response = await fetchWithTimeout(`${baseUrl}/api/version`, { method: "GET" }, timeoutMs);
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
    const data = (await response.json()) as { error?: string };
    return data?.error ?? response.statusText;
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
