import type { AIModelMeta } from "@/ai/types";

export const DEFAULT_MODELS: AIModelMeta[] = [
  { id: "llama3", label: "Llama 3", provider: "ollama", tags: ["local", "free"] },
  { id: "mistral", label: "Mistral", provider: "ollama", tags: ["local", "free"] },
  { id: "phi3", label: "Phi 3", provider: "ollama", tags: ["local", "free"] },
  { id: "deepseek", label: "DeepSeek", provider: "ollama", tags: ["local", "free"] },
  { id: "gemma", label: "Gemma", provider: "ollama", tags: ["local", "free"] },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", provider: "groq" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", provider: "groq" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", provider: "groq" },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    label: "Llama 3.1 8B Instruct (Free)",
    provider: "openrouter",
    tags: ["free"],
  },
  {
    id: "google/gemma-7b-it:free",
    label: "Gemma 7B IT (Free)",
    provider: "openrouter",
    tags: ["free"],
  },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "gemini" },
  {
    id: "HuggingFaceH4/zephyr-7b-beta",
    label: "Zephyr 7B Beta",
    provider: "huggingface",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    label: "Llama 3.1 8B Turbo",
    provider: "together",
  },
  { id: "local-model", label: "Local Model", provider: "lmstudio", tags: ["local"] },
];

export function getDefaultModelsForProvider(provider: AIModelMeta["provider"]) {
  return DEFAULT_MODELS.filter((model) => model.provider === provider);
}
