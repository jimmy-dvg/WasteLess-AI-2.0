export type AssistantChatRole = "user" | "assistant";

export type AssistantChatMessageInput = {
  role: AssistantChatRole;
  content: string;
};

export type AssistantShoppingItem = {
  name: string;
  quantity?: string | null;
  unit?: string | null;
};

export type AssistantExecutedAction = {
  type: "add_to_shopping_list";
  items: AssistantShoppingItem[];
  insertedCount: number;
  skippedCount: number;
  listId: string;
};

export type AssistantContextPriorityItem = {
  name: string;
  quantity: string;
  status: "fresh" | "expiring" | "expired";
  expirationDateLabel: string;
};

export type AssistantContextSummary = {
  householdName: string;
  inventoryCount: number;
  expiringCount: number;
  expiredCount: number;
  shoppingItemCount: number;
  priorityItems: AssistantContextPriorityItem[];
  aiProviderLabel: string;
};

export type AssistantChatResponse = {
  answer: string;
  suggestions: string[];
  executedActions: AssistantExecutedAction[];
  contextSummary: AssistantContextSummary;
  fallback: boolean;
  fallbackReason?: string | null;
};
