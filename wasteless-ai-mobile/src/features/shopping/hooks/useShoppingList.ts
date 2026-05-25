import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import {
  clearCheckedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  generateShoppingList,
  listShoppingItems,
  updateShoppingItem,
} from '../api';
import type {
  CreateShoppingItemPayload,
  ShoppingListData,
  ShoppingListGenerationRequest,
  ShoppingListGenerationResult,
  ShoppingListItem,
  ShoppingMutationResult,
  UpdateShoppingItemPayload,
} from '../types';

const emptyShoppingListData: ShoppingListData = {
  list: null,
  items: [],
};

export function useShoppingList() {
  const { token } = useAuth();
  const [data, setData] = useState<ShoppingListData>(emptyShoppingListData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<ShoppingListGenerationResult | null>(null);

  const loadShoppingList = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setData(emptyShoppingListData);
        setError('Sign in to view your shopping list.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const nextData = await listShoppingItems(token);
        setData(nextData);
        setError(null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load shopping list.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadShoppingList();
  }, [loadShoppingList]);

  const refresh = useCallback(() => loadShoppingList('refresh'), [loadShoppingList]);

  const runMutation = useCallback(
    async (
      request: (authToken: string) => Promise<ShoppingListItem | ShoppingListGenerationResult | void>,
      fallbackMessage: string,
    ): Promise<ShoppingMutationResult> => {
      if (!token) {
        return { success: false, error: 'Sign in to manage your shopping list.' };
      }

      setIsSubmitting(true);

      try {
        const response = await request(token);
        await loadShoppingList();
        setError(null);

        if (response && 'insertedCount' in response) {
          setLastGeneration(response);
          return { success: true, result: response };
        }

        return { success: true, item: response ?? undefined };
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, fallbackMessage);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadShoppingList, token],
  );

  const createItem = useCallback(
    (item: CreateShoppingItemPayload) =>
      runMutation(
        (authToken) => createShoppingItem(authToken, item),
        'Unable to add shopping item.',
      ),
    [runMutation],
  );

  const updateItem = useCallback(
    (id: string, item: UpdateShoppingItemPayload) =>
      runMutation(
        (authToken) => updateShoppingItem(authToken, id, item),
        'Unable to update shopping item.',
      ),
    [runMutation],
  );

  const toggleItemChecked = useCallback(
    (item: ShoppingListItem) => updateItem(item.id, { checked: !item.checked }),
    [updateItem],
  );

  const deleteItem = useCallback(
    (id: string) =>
      runMutation(
        (authToken) => deleteShoppingItem(authToken, id),
        'Unable to delete shopping item.',
      ),
    [runMutation],
  );

  const clearChecked = useCallback(
    () =>
      runMutation(
        async (authToken) => {
          await clearCheckedShoppingItems(authToken);
        },
        'Unable to clear checked shopping items.',
      ),
    [runMutation],
  );

  const generateItems = useCallback(
    (request: ShoppingListGenerationRequest) =>
      runMutation(
        (authToken) => generateShoppingList(authToken, request),
        'Unable to generate shopping list.',
      ),
    [runMutation],
  );

  return useMemo(
    () => ({
      clearChecked,
      createItem,
      data,
      deleteItem,
      error,
      generateItems,
      isLoading,
      isRefreshing,
      isSubmitting,
      items: data.items,
      lastGeneration,
      list: data.list,
      refresh,
      toggleItemChecked,
      updateItem,
    }),
    [
      clearChecked,
      createItem,
      data,
      deleteItem,
      error,
      generateItems,
      isLoading,
      isRefreshing,
      isSubmitting,
      lastGeneration,
      refresh,
      toggleItemChecked,
      updateItem,
    ],
  );
}
