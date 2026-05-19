import "server-only";

import type { AIProvider, AITextRequest, AITextResponse } from "@/ai/types";
import { errorFromHttpStatus } from "@/ai/utils/errors";
import { fetchWithTimeout } from "@/ai/utils/fetch";

export type GeminiProviderConfig = {
  apiKey?: string;
  defaultModel: string;
};

export function createGeminiProvider(config: GeminiProviderConfig, timeoutMs: number): AIProvider {
  const generateText = async (request: AITextRequest): Promise<AITextResponse> => {
    const started = Date.now();
    const model = request.model ?? config.defaultModel;

    const systemMessage = request.messages.find((message) => message.role === "system")?.content;
    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
          generationConfig: {
            temperature: request.temperature ?? 0.2,
            maxOutputTokens: request.maxTokens ?? 1200,
            responseMimeType: request.responseType === "json" ? "application/json" : undefined,
          },
        }),
        signal: request.signal ?? undefined,
      },
      timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, "gemini", message);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      provider: "gemini",
      model,
      outputText,
      latencyMs: Date.now() - started,
      raw: data,
      requestId: request.requestId,
    };
  };

  return {
    id: "gemini",
    name: "Gemini",
    capabilities: { streaming: false, jsonSchema: false, embeddings: false },
    isAvailable: async () => Boolean(config.apiKey),
    generateText,
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
