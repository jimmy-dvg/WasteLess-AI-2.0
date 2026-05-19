import "server-only";

import type { AIProvider, AITextRequest, AITextResponse } from "@/ai/types";
import { errorFromHttpStatus } from "@/ai/utils/errors";
import { fetchWithTimeout } from "@/ai/utils/fetch";
import { messagesToPromptString } from "@/ai/utils/prompt";

export type HuggingFaceProviderConfig = {
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
};

export function createHuggingFaceProvider(config: HuggingFaceProviderConfig, timeoutMs: number): AIProvider {
  const generateText = async (request: AITextRequest): Promise<AITextResponse> => {
    const started = Date.now();
    const model = request.model ?? config.defaultModel;
    const prompt = messagesToPromptString(request.messages);

    const response = await fetchWithTimeout(
      `${config.baseUrl}/${model}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: request.maxTokens ?? 800,
            temperature: request.temperature ?? 0.2,
            return_full_text: false,
          },
        }),
        signal: request.signal ?? undefined,
      },
      timeoutMs
    );

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw errorFromHttpStatus(response.status, "huggingface", message);
    }

    const data = (await response.json()) as Array<{ generated_text?: string }> | { generated_text?: string };
    const outputText = Array.isArray(data) ? data[0]?.generated_text ?? "" : data.generated_text ?? "";

    return {
      provider: "huggingface",
      model,
      outputText,
      latencyMs: Date.now() - started,
      raw: data,
      requestId: request.requestId,
    };
  };

  return {
    id: "huggingface",
    name: "Hugging Face",
    capabilities: { streaming: false, jsonSchema: false, embeddings: false },
    isAvailable: async () => Boolean(config.apiKey),
    generateText,
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
