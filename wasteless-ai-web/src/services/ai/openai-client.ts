import "server-only";

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export function getOpenAIClient() {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel() {
  return defaultModel;
}
