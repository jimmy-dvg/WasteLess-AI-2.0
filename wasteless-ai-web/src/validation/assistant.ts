import { z } from "zod";

export const assistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Message is required").max(2000, "Message is too long"),
});

export const assistantChatRequestSchema = z
  .object({
    messages: z.array(assistantChatMessageSchema).min(1).max(12),
  })
  .refine((value) => value.messages[value.messages.length - 1]?.role === "user", {
    message: "Last message must be from the user",
    path: ["messages"],
  });

function nullableText(max: number) {
  return z.preprocess((value) => {
    if (value == null) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }, z.string().max(max).nullable());
}

export const assistantShoppingItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  quantity: nullableText(32),
  unit: nullableText(32),
});

export const assistantAiResponseSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;

  return {
    answer: source.answer ?? source.message ?? source.response,
    intent: source.intent ?? "answer",
    shopping_items: source.shopping_items ?? source.shoppingItems ?? [],
    follow_up_suggestions: source.follow_up_suggestions ?? source.followUpSuggestions ?? source.suggestions ?? [],
  };
}, z.object({
  answer: z.string().trim().min(1).max(1400),
  intent: z.enum(["answer", "shopping_add"]).default("answer"),
  shopping_items: z.array(assistantShoppingItemSchema).max(12).default([]),
  follow_up_suggestions: z.array(z.string().trim().min(2).max(90)).max(4).default([]),
}));

export type AssistantChatRequestInput = z.infer<typeof assistantChatRequestSchema>;
export type AssistantAiResponseInput = z.infer<typeof assistantAiResponseSchema>;
