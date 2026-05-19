import type { AIMessage } from "@/ai/types";

const JSON_DIRECTIVES = [
  "Return ONLY valid JSON.",
  "Do not wrap the response in markdown.",
  "Do not include extra keys.",
];

export function ensureSystemMessage(messages: AIMessage[], systemText?: string): AIMessage[] {
  const hasSystem = messages.some((message) => message.role === "system");
  if (hasSystem || !systemText) return messages;
  return [{ role: "system", content: systemText }, ...messages];
}

export function buildJsonInstruction(jsonSchema?: unknown) {
  if (!jsonSchema) {
    return JSON_DIRECTIVES.join(" ");
  }

  return `${JSON_DIRECTIVES.join(" ")} JSON Schema: ${JSON.stringify(jsonSchema)}`;
}

export function withJsonInstruction(messages: AIMessage[], jsonSchema?: unknown): AIMessage[] {
  const instruction = buildJsonInstruction(jsonSchema);
  if (messages.length === 0) {
    return [{ role: "system", content: instruction }];
  }

  const [first, ...rest] = messages;
  if (first.role === "system") {
    return [{ ...first, content: `${first.content} ${instruction}`.trim() }, ...rest];
  }

  return [{ role: "system", content: instruction }, ...messages];
}

export function messagesToPromptString(messages: AIMessage[]) {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");
}
