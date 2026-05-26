import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api/client';
import { syncLocalReminderSources } from '@/features/notifications/deviceNotifications';
import { useAuth } from '@/store/authStore';
import {
  createInventoryItem,
  defaultInventoryFilters,
  deleteInventoryItem,
  getInventoryItem,
  listInventoryItems,
  updateInventoryItem,
} from '../api';
import type {
  CreateInventoryItemPayload,
  InventoryFilters,
  InventoryItem,
  InventoryMutationResult,
  InventoryPageData,
  UpdateInventoryItemPayload,
} from '../types';

function getEmptyInventoryData(filters: InventoryFilters): InventoryPageData {
  return {
    items: [],
    categories: [],
    locations: [],
    totalCount: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: 1,
  };
}

export function useInventory() {
  const { token } = useAuth();
  const [filters, setFilters] = useState<InventoryFilters>(defaultInventoryFilters);
  const [data, setData] = useState<InventoryPageData>(() =>
    getEmptyInventoryData(defaultInventoryFilters),
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setData(getEmptyInventoryData(filters));
        setError('Sign in to view your inventory.');
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
        const nextData = await listInventoryItems(token, filters);
        setData(nextData);
        void syncLocalReminderSources({ inventoryItems: nextData.items });
        setError(null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load inventory.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, token],
  );

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const updateFilters = useCallback((nextFilters: Partial<InventoryFilters>) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultInventoryFilters);
  }, []);

  const refresh = useCallback(() => loadInventory('refresh'), [loadInventory]);

  const fetchItem = useCallback(
    async (id: string) => {
      if (!token) return null;

      try {
        const item = await getInventoryItem(token, id);
        setError(null);
        return item;
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load inventory item.'));
        return null;
      }
    },
    [token],
  );

  const runMutation = useCallback(
    async (
      request: (authToken: string) => Promise<InventoryItem | void>,
      fallbackMessage: string,
    ): Promise<InventoryMutationResult> => {
      if (!token) {
        return { success: false, error: 'Sign in to manage inventory.' };
      }

      setIsSubmitting(true);
      try {
        const item = await request(token);
        await loadInventory();
        setError(null);
        return { success: true, item: item ?? undefined };
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, fallbackMessage);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadInventory, token],
  );

  const createItem = useCallback(
    (item: CreateInventoryItemPayload) =>
      runMutation(
        (authToken) => createInventoryItem(authToken, item),
        'Unable to add inventory item.',
      ),
    [runMutation],
  );

  const updateItem = useCallback(
    (id: string, item: UpdateInventoryItemPayload) =>
      runMutation(
        (authToken) => updateInventoryItem(authToken, id, item),
        'Unable to update inventory item.',
      ),
    [runMutation],
  );

  const deleteItem = useCallback(
    (id: string) =>
      runMutation((authToken) => deleteInventoryItem(authToken, id), 'Unable to delete item.'),
    [runMutation],
  );

  return useMemo(
    () => ({
      categories: data.categories,
      createItem,
      data,
      deleteItem,
      error,
      fetchItem,
      filters,
      isLoading,
      isRefreshing,
      isSubmitting,
      items: data.items,
      locations: data.locations,
      refresh,
      resetFilters,
      updateFilters,
      updateItem,
    }),
    [
      createItem,
      data,
      deleteItem,
      error,
      fetchItem,
      filters,
      isLoading,
      isRefreshing,
      isSubmitting,
      refresh,
      resetFilters,
      updateFilters,
      updateItem,
    ],
  );
}
