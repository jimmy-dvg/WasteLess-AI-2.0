import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { InventoryFilters } from '@/features/inventory/components/InventoryFilters';
import { InventoryForm } from '@/features/inventory/components/InventoryForm';
import { InventoryItemCard } from '@/features/inventory/components/InventoryItemCard';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import type {
  CreateInventoryItemPayload,
  InventoryItem,
  InventoryMutationResult,
} from '@/features/inventory/types';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const inventory = useInventory();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  function openCreateForm() {
    setEditingItem(null);
    setFormMode('create');
  }

  async function openEditForm(item: InventoryItem) {
    setIsLoadingItem(true);
    const currentItem = await inventory.fetchItem(item.id);
    setIsLoadingItem(false);

    if (!currentItem) return;

    setEditingItem(currentItem);
    setFormMode('edit');
  }

  function closeForm() {
    if (inventory.isSubmitting) return;

    setFormMode(null);
    setEditingItem(null);
  }

  async function handleFormSubmit(
    payload: CreateInventoryItemPayload,
  ): Promise<InventoryMutationResult> {
    const result =
      formMode === 'edit' && editingItem
        ? await inventory.updateItem(editingItem.id, payload)
        : await inventory.createItem(payload);

    if (result.success) {
      closeForm();
    }

    return result;
  }

  function confirmDeleteItem(item: InventoryItem) {
    Alert.alert('Delete item?', `Remove ${item.name} from your inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void inventory.deleteItem(item.id);
        },
      },
    ]);
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      scroll={false}
      title="Inventory"
      subtitle="Pantry, fridge, and freezer products synced from your WasteLessAI account.">
      <View style={styles.toolbar}>
        <Button title="Add item" onPress={openCreateForm} style={styles.addButton} />
      </View>

      <InventoryFilters
        categories={inventory.categories}
        filters={inventory.filters}
        locations={inventory.locations}
        onChange={inventory.updateFilters}
      />

      {inventory.error && inventory.items.length > 0 ? (
        <View style={[styles.inlineError, { borderColor: colors.danger }]}>
          <Text style={[styles.inlineErrorText, { color: colors.danger }]}>{inventory.error}</Text>
        </View>
      ) : null}

      <View style={styles.listContainer}>
        {inventory.isLoading && inventory.items.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={inventory.items}
            keyExtractor={(item: InventoryItem) => item.id}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={inventory.isRefreshing}
                tintColor={colors.tint}
                onRefresh={inventory.refresh}
              />
            }
            renderItem={({ item }: ListRenderItemInfo<InventoryItem>) => (
              <InventoryItemCard
                disabled={inventory.isSubmitting || isLoadingItem}
                item={item}
                onDelete={confirmDeleteItem}
                onEdit={openEditForm}
              />
            )}
            ListEmptyComponent={
              inventory.error ? (
                <ErrorState message={inventory.error} onRetry={inventory.refresh} />
              ) : (
                <EmptyState />
              )
            }
          />
        )}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={closeForm}
        presentationStyle="pageSheet"
        visible={formMode !== null}>
        {formMode ? (
          <InventoryForm
            categories={inventory.categories}
            initialItem={editingItem}
            isSubmitting={inventory.isSubmitting}
            locations={inventory.locations}
            mode={formMode}
            onCancel={closeForm}
            onSubmit={handleFormSubmit}
          />
        ) : null}
      </Modal>
    </Screen>
  );
}

function EmptyState() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.emptyState, { borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No inventory items yet</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
        Add your first pantry, fridge, or freezer item.
      </Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.emptyState, { borderColor: colors.danger }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Inventory unavailable</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>{message}</Text>
      <Button title="Retry" onPress={onRetry} variant="secondary" style={styles.retryButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    gap: 16,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    minWidth: 132,
  },
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  inlineError: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  inlineErrorText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCopy: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});
