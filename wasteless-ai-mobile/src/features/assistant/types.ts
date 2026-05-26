export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AssistantShoppingItem = {
  name: string;
  quantity: string | null;
  unit: string | null;
};

export type AssistantChatResponse = {
  answer: string;
  intent: string;
  shoppingItems: AssistantShoppingItem[];
  followUpSuggestions: string[];
};
