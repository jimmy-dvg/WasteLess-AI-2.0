import { API_ENDPOINTS } from '@/services/api/endpoints';
import { apiRequest } from '@/services/api/client';
import {
  getSuccessData,
  isRecord,
  readNullableString,
  readString,
} from '@/services/api/response';
import type {
  AssistantChatMessage,
  AssistantChatResponse,
  AssistantShoppingItem,
} from './types';

function parseShoppingItem(value: unknown): AssistantShoppingItem | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  if (!name) return null;

  return {
    name,
    quantity: readNullableString(value.quantity),
    unit: readNullableString(value.unit),
  };
}

function parseAssistantResponse(payload: unknown): AssistantChatResponse {
  const data = getSuccessData(payload, 'Invalid assistant response from server.');
  if (!isRecord(data)) {
    throw new Error('Invalid assistant response from server.');
  }

  const executedActions = Array.isArray(data.executedActions) ? data.executedActions : [];
  const actionShoppingItems = executedActions.flatMap((action) => {
    if (!isRecord(action) || !Array.isArray(action.items)) return [];
    return action.items;
  });

  return {
    answer: readString(data.answer),
    intent: readString(data.intent, 'answer'),
    shoppingItems: Array.isArray(data.shopping_items)
      ? data.shopping_items
          .map(parseShoppingItem)
          .filter((item): item is AssistantShoppingItem => Boolean(item))
      : actionShoppingItems
          .map(parseShoppingItem)
          .filter((item): item is AssistantShoppingItem => Boolean(item)),
    followUpSuggestions: Array.isArray(data.suggestions)
      ? data.suggestions.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export async function sendAssistantMessage(
  token: string,
  messages: AssistantChatMessage[],
): Promise<AssistantChatResponse> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.assistant.chat, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify({ messages }),
  });

  return parseAssistantResponse(payload);
}
