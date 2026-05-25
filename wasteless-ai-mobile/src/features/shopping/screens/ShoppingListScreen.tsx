import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { listRecipes } from '@/features/recipes/api';
import type { RecipeSuggestion } from '@/features/recipes/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import {
  emptyShoppingItemFormState,
  ShoppingItemForm,
  type ShoppingItemFormState,
} from '../components/ShoppingItemForm';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { useShoppingList } from '../hooks/useShoppingList';
import type {
  CreateShoppingItemPayload,
  ShoppingIngredientInput,
  ShoppingListFilter,
  ShoppingListGenerationResult,
  ShoppingListItem,
} from '../types';

const FILTER_OPTIONS: { label: string; value: ShoppingListFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Checked', value: 'checked' },
  { label: 'Recipe', value: 'recipe-derived' },
  { label: 'Low stock', value: 'low-stock' },
  { label: 'Manual', value: 'manual' },
];

type GenerateMode = 'recipes' | 'low-stock' | 'smart';

function parseQuantityInput(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const quantity = Number(normalized);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function cleanText(value: string) {
  const text = value.trim();
  return text ? text : null;
}

function formStateFromItem(item: ShoppingListItem): ShoppingItemFormState {
  return {
    name: item.name,
    quantity: item.quantity == null ? '' : String(item.quantity),
    unit: item.unit ?? '',
    category: item.category ?? '',
    note: item.note ?? '',
  };
}

function payloadFromDraft(draft: ShoppingItemFormState): CreateShoppingItemPayload {
  return {
    name: draft.name.trim(),
    quantity: parseQuantityInput(draft.quantity),
    unit: cleanText(draft.unit),
    category: cleanText(draft.category),
    note: cleanText(draft.note),
    source: 'manual',
  };
}

function filterItems(items: ShoppingListItem[], filter: ShoppingListFilter) {
  switch (filter) {
    case 'active':
      return items.filter((item) => !item.checked);
    case 'checked':
      return items.filter((item) => item.checked);
    case 'recipe-derived':
      return items.filter((item) => item.source === 'recipe');
    case 'low-stock':
      return items.filter((item) => item.source === 'low-stock');
    case 'manual':
      return items.filter((item) => item.source === 'manual');
    case 'all':
    default:
      return items;
  }
}

function getRecipeSources(recipes: RecipeSuggestion[]) {
  const uniqueRecipes = new Map<string, RecipeSuggestion>();
  recipes.forEach((recipe) => uniqueRecipes.set(recipe.id, recipe));

  return Array.from(uniqueRecipes.values())
    .filter((recipe) => recipe.missingIngredients.length > 0)
    .map((recipe) => ({
      recipeId: recipe.id,
      title: recipe.title,
      missingIngredients: recipe.missingIngredients.map((ingredient): ShoppingIngredientInput => ({
        name: ingredient.name,
        quantity: ingredient.quantity ?? null,
        unit: ingredient.unit ?? null,
        note: ingredient.notes ?? recipe.title,
      })),
    }));
}

function formatGenerationMessage(result: ShoppingListGenerationResult) {
  if (result.insertedCount === 0) {
    return result.skippedCount > 0
      ? 'Those shopping items are already listed.'
      : 'No shopping items were generated.';
  }

  const skipped =
    result.skippedCount > 0
      ? ` ${result.skippedCount} already listed.`
      : '';

  return `${result.insertedCount} shopping item${result.insertedCount === 1 ? '' : 's'} added.${skipped}`;
}

function FilterPill({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.filterPill,
        {
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.filterText, { color: selected ? colors.onTint : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function GenerateButton({
  disabled,
  icon,
  loading,
  onPress,
  title,
}: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  onPress: () => void;
  title: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.generateButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.tint} size="small" />
      ) : (
        <Ionicons name={icon} size={18} color={colors.tint} />
      )}
      <Text style={[styles.generateText, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function ShoppingListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const {
    clearChecked,
    createItem,
    deleteItem,
    error,
    generateItems,
    isLoading,
    isRefreshing,
    isSubmitting,
    items,
    list,
    refresh,
    toggleItemChecked,
    updateItem,
  } = useShoppingList();
  const [filter, setFilter] = useState<ShoppingListFilter>('all');
  const [draft, setDraft] = useState<ShoppingItemFormState>(emptyShoppingItemFormState);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [generatingMode, setGeneratingMode] = useState<GenerateMode | null>(null);

  const filteredItems = useMemo(() => filterItems(items, filter), [filter, items]);
  const activeCount = useMemo(() => items.filter((item) => !item.checked).length, [items]);
  const checkedCount = items.length - activeCount;
  const isBusy = isSubmitting || generatingMode != null;

  async function submitForm() {
    const payload = payloadFromDraft(draft);

    if (payload.name.length < 2) {
      setFormError('Item name must be at least 2 characters.');
      return;
    }

    setFormError(null);
    setFeedback(null);

    const result = editingItem
      ? await updateItem(editingItem.id, {
          name: payload.name,
          quantity: payload.quantity,
          unit: payload.unit,
          category: payload.category,
          note: payload.note,
        })
      : await createItem(payload);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setDraft(emptyShoppingItemFormState);
    setEditingItem(null);
    setFeedback(editingItem ? 'Shopping item updated.' : 'Shopping item added.');
  }

  function startEditing(item: ShoppingListItem) {
    setEditingItem(item);
    setDraft(formStateFromItem(item));
    setFormError(null);
    setFeedback(null);
  }

  function cancelEditing() {
    setEditingItem(null);
    setDraft(emptyShoppingItemFormState);
    setFormError(null);
  }

  function confirmDelete(item: ShoppingListItem) {
    Alert.alert('Delete item?', `Remove ${item.name} from your shopping list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await deleteItem(item.id);
            if (result.success) setFeedback(`${item.name} removed.`);
          })();
        },
      },
    ]);
  }

  function confirmClearChecked() {
    if (checkedCount === 0) {
      setFeedback('No checked items to clear.');
      return;
    }

    Alert.alert('Clear checked items?', `Remove ${checkedCount} checked item${checkedCount === 1 ? '' : 's'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await clearChecked();
            if (result.success) setFeedback('Checked items cleared.');
          })();
        },
      },
    ]);
  }

  async function loadRecipeSourcesForShopping() {
    if (!token) return [];

    const recipeCollection = await listRecipes(token);
    return getRecipeSources([...recipeCollection.recipes, ...recipeCollection.favoriteRecipes]);
  }

  async function handleGenerate(mode: GenerateMode) {
    if (!token || generatingMode) return;

    setGeneratingMode(mode);
    setFeedback(null);
    setFormError(null);

    try {
      const recipeSources = mode === 'low-stock' ? [] : await loadRecipeSourcesForShopping();

      if (mode === 'recipes' && recipeSources.length === 0) {
        setFeedback('No recipe gaps found.');
        return;
      }

      const result = await generateItems({
        recipes: recipeSources,
        includeRecipeMissing: mode !== 'low-stock',
        includeLowStock: mode !== 'recipes',
      });

      if (!result.success || !result.result) {
        setFeedback(result.success ? 'No shopping items were generated.' : result.error);
        return;
      }

      setFeedback(formatGenerationMessage(result.result));
    } catch (requestError) {
      setFeedback(getApiErrorMessage(requestError, 'Unable to generate shopping items.'));
    } finally {
      setGeneratingMode(null);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.tint} />
      }
      title="Shopping"
      subtitle={`${list?.name ?? 'Shopping list'} · ${activeCount} active · ${checkedCount} checked`}>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <>
          <ShoppingItemForm
            disabled={isBusy}
            draft={draft}
            error={formError}
            mode={editingItem ? 'edit' : 'create'}
            onCancelEdit={cancelEditing}
            onChange={setDraft}
            onSubmit={() => {
              void submitForm();
            }}
          />

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Generate</Text>
              <Pressable
                accessibilityRole="button"
                disabled={isBusy || checkedCount === 0}
                onPress={confirmClearChecked}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.clearButton,
                  { borderColor: colors.border },
                  pressed && !isBusy ? styles.pressed : null,
                  isBusy || checkedCount === 0 ? styles.disabled : null,
                ]}>
                <Ionicons name="checkmark-done-outline" size={17} color={colors.danger} />
                <Text style={[styles.clearText, { color: colors.danger }]}>Clear checked</Text>
              </Pressable>
            </View>

            <View style={styles.generateGrid}>
              <GenerateButton
                disabled={isBusy}
                icon="restaurant-outline"
                loading={generatingMode === 'recipes'}
                onPress={() => {
                  void handleGenerate('recipes');
                }}
                title="Recipe gaps"
              />
              <GenerateButton
                disabled={isBusy}
                icon="trending-down-outline"
                loading={generatingMode === 'low-stock'}
                onPress={() => {
                  void handleGenerate('low-stock');
                }}
                title="Low stock"
              />
              <GenerateButton
                disabled={isBusy}
                icon="sparkles-outline"
                loading={generatingMode === 'smart'}
                onPress={() => {
                  void handleGenerate('smart');
                }}
                title="Smart add"
              />
            </View>
          </View>

          {error ? (
            <View style={[styles.feedbackBox, { borderColor: colors.danger }]}>
              <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {feedback ? (
            <View style={[styles.feedbackBox, { borderColor: colors.tint }]}>
              <Text style={[styles.feedbackText, { color: colors.text }]}>{feedback}</Text>
            </View>
          ) : null}

          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map((option) => (
              <FilterPill
                key={option.value}
                label={option.label}
                onPress={() => setFilter(option.value)}
                selected={filter === option.value}
              />
            ))}
          </View>

          <View style={styles.listSection}>
            {items.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Shopping list is empty</Text>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Add an item manually or generate from recipes and low-stock inventory.
                </Text>
              </View>
            ) : null}

            {items.length > 0 && filteredItems.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No items in this view</Text>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Try another filter or refresh the list.
                </Text>
              </View>
            ) : null}

            {filteredItems.map((item) => (
              <ShoppingItemCard
                disabled={isBusy}
                item={item}
                key={item.id}
                onDelete={confirmDelete}
                onEdit={startEditing}
                onToggle={(nextItem) => {
                  void toggleItemChecked(nextItem);
                }}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 16,
  },
  centerState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '800',
  },
  generateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  generateButton: {
    minHeight: 44,
    flexGrow: 1,
    flexBasis: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 7,
  },
  generateText: {
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '800',
  },
  listSection: {
    gap: 10,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
