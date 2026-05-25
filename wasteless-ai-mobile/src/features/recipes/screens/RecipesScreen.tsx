import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { listInventoryItems } from '@/features/inventory/api';
import type { InventoryItem } from '@/features/inventory/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import {
  deleteSavedRecipe,
  generateRecipes,
  getRecipeDetail,
  listRecipes,
  saveRecipe,
} from '../api';
import { RecipeCard } from '../components/RecipeCard';
import type {
  RecipeDifficulty,
  RecipeGenerationMode,
  RecipeGenerationPreferences,
  RecipeMealType,
  RecipeSuggestion,
} from '../types';

const MODE_OPTIONS: { label: string; value: RecipeGenerationMode }[] = [
  { label: 'Expiring', value: 'expiring-soon' },
  { label: 'All', value: 'all' },
  { label: 'Selected', value: 'selected' },
];

const MEAL_OPTIONS: { label: string; value: RecipeMealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

const DIFFICULTY_OPTIONS: { label: string; value: RecipeDifficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

function parsePositiveInt(value: string, fallback?: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatInventoryMeta(item: InventoryItem) {
  return [item.quantity, item.unit, item.storageLocation ?? item.categoryName]
    .filter(Boolean)
    .join(' ');
}

function recipeWithSaved(recipe: RecipeSuggestion, isSaved: boolean): RecipeSuggestion {
  return { ...recipe, isSaved };
}

function OptionPill<TValue extends string>({
  disabled,
  label,
  onPress,
  selected,
  value,
}: {
  disabled?: boolean;
  label: string;
  onPress: (value: TValue) => void;
  selected: boolean;
  value: TValue;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onPress(value)}
      style={({ pressed }: { pressed: boolean }) => [
        styles.optionPill,
        {
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={[styles.optionText, { color: selected ? colors.onTint : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InventorySelection({
  items,
  selectedIds,
  onToggle,
}: {
  items: InventoryItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const selected = new Set(selectedIds);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyBox, { borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No usable inventory items</Text>
        <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
          Add fresh or expiring items before using selected mode.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.inventorySelector}>
      {items.map((item) => {
        const isSelected = selected.has(item.id);

        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.inventoryChoice,
              {
                backgroundColor: isSelected ? '#E7F7ED' : colors.surface,
                borderColor: isSelected ? colors.tint : colors.border,
              },
              pressed ? styles.pressed : null,
            ]}>
            <Ionicons
              name={isSelected ? 'checkbox-outline' : 'square-outline'}
              size={22}
              color={isSelected ? colors.tint : colors.mutedText}
            />
            <View style={styles.inventoryChoiceText}>
              <Text style={[styles.inventoryName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.inventoryMeta, { color: colors.mutedText }]}>
                {formatInventoryMeta(item) || 'In inventory'}
              </Text>
            </View>
            {item.status === 'expiring' ? (
              <View style={styles.expiringBadge}>
                <Text style={styles.expiringBadgeText}>Soon</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function RecipesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<RecipeSuggestion[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, RecipeSuggestion>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string | null>>({});
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [regeneratingRecipeId, setRegeneratingRecipeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pantryStaples, setPantryStaples] = useState<string[]>([]);
  const [mode, setMode] = useState<RecipeGenerationMode>('expiring-soon');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [mealType, setMealType] = useState<RecipeMealType>('dinner');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('easy');
  const [cuisine, setCuisine] = useState('');
  const [dietary, setDietary] = useState('');
  const [maxCookTime, setMaxCookTime] = useState('30');
  const [servings, setServings] = useState('2');

  const usableInventory = useMemo(
    () => inventoryItems.filter((item) => item.status !== 'expired'),
    [inventoryItems],
  );

  const expiringInventory = useMemo(
    () => usableInventory.filter((item) => item.status === 'expiring'),
    [usableInventory],
  );

  const selectedInventory = useMemo(() => {
    const selected = new Set(selectedItemIds);
    return usableInventory.filter((item) => selected.has(item.id));
  }, [selectedItemIds, usableInventory]);

  const activeInventory = useMemo(() => {
    if (mode === 'expiring-soon') return expiringInventory;
    if (mode === 'selected') return selectedInventory;
    return usableInventory;
  }, [expiringInventory, mode, selectedInventory, usableInventory]);

  const preferences = useMemo<RecipeGenerationPreferences>(
    () => ({
      mealType,
      cuisine: cuisine.trim() || undefined,
      dietary: parseList(dietary),
      maxCookingTimeMinutes: parsePositiveInt(maxCookTime),
      servings: parsePositiveInt(servings),
      difficulty,
    }),
    [cuisine, dietary, difficulty, maxCookTime, mealType, servings],
  );

  const emptyReason = useMemo(() => {
    if (usableInventory.length === 0) return 'Add inventory items before generating recipes.';
    if (mode === 'selected' && selectedInventory.length === 0) {
      return 'Select at least one inventory item.';
    }
    if (mode === 'expiring-soon' && expiringInventory.length === 0) {
      return 'No expiring-soon items are available.';
    }
    return null;
  }, [expiringInventory.length, mode, selectedInventory.length, usableInventory.length]);

  const canGenerate = Boolean(token) && !isGenerating && !emptyReason;

  const loadRecipeData = useCallback(async () => {
    if (!token) {
      setInventoryItems([]);
      setRecipes([]);
      setFavoriteRecipes([]);
      setError('Sign in to generate recipes.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [inventoryData, recipeData] = await Promise.all([
        listInventoryItems(token, {
          page: 1,
          pageSize: 50,
          sort: 'expiration_asc',
          status: 'all',
        }),
        listRecipes(token),
      ]);

      setInventoryItems(inventoryData.items);
      setRecipes(recipeData.recipes);
      setFavoriteRecipes(recipeData.favoriteRecipes);

      if (recipeData.preferences) {
        setMealType(recipeData.preferences.mealType ?? 'dinner');
        setDifficulty(recipeData.preferences.difficulty ?? 'easy');
        setCuisine(recipeData.preferences.cuisine ?? '');
        setDietary(recipeData.preferences.dietary.join(', '));
        setMaxCookTime(String(recipeData.preferences.maxCookingTimeMinutes ?? 30));
        setServings(String(recipeData.preferences.servings ?? 2));
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load recipe data.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRecipeData();
  }, [loadRecipeData]);

  function toggleSelectedItem(id: string) {
    setSelectedItemIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  }

  async function loadRecipeDetail(recipe: RecipeSuggestion) {
    if (!token || detailsById[recipe.id] || recipe.steps.length > 0) return;

    setLoadingDetailId(recipe.id);
    setDetailErrors((current) => ({ ...current, [recipe.id]: null }));

    try {
      const detail = await getRecipeDetail(token, recipe.id);
      setDetailsById((current) => ({ ...current, [recipe.id]: detail }));
    } catch (requestError) {
      setDetailErrors((current) => ({
        ...current,
        [recipe.id]: getApiErrorMessage(requestError, 'Unable to load recipe detail.'),
      }));
    } finally {
      setLoadingDetailId(null);
    }
  }

  function updateSavedState(recipeId: string, isSaved: boolean) {
    setRecipes((current) =>
      current.map((recipe) => (recipe.id === recipeId ? recipeWithSaved(recipe, isSaved) : recipe)),
    );
    setDetailsById((current) => {
      const detail = current[recipeId];
      if (!detail) return current;
      return { ...current, [recipeId]: recipeWithSaved(detail, isSaved) };
    });
  }

  async function handleToggleRecipe(recipe: RecipeSuggestion) {
    if (expandedRecipeId === recipe.id) {
      setExpandedRecipeId(null);
      return;
    }

    setExpandedRecipeId(recipe.id);
    await loadRecipeDetail(recipe);
  }

  async function handleFavorite(recipe: RecipeSuggestion) {
    if (!token || savingRecipeId) return;

    setSavingRecipeId(recipe.id);
    setError(null);

    try {
      const next = recipe.isSaved
        ? await deleteSavedRecipe(token, recipe.id)
        : await saveRecipe(token, recipe.id);
      const nextRecipe = recipeWithSaved(detailsById[recipe.id] ?? recipe, next.saved);

      updateSavedState(recipe.id, next.saved);
      setFavoriteRecipes((current) => {
        const withoutRecipe = current.filter((item) => item.id !== recipe.id);
        return next.saved ? [nextRecipe, ...withoutRecipe].slice(0, 8) : withoutRecipe;
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update saved recipe.'));
    } finally {
      setSavingRecipeId(null);
    }
  }

  async function handleGenerate() {
    if (!token || !canGenerate) {
      setError(emptyReason ?? 'Sign in to generate recipes.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSummary(null);
    setPantryStaples([]);
    setExpandedRecipeId(null);

    try {
      const result = await generateRecipes(token, {
        mode,
        inventoryItemIds: selectedItemIds,
        preferences,
        maxRecipes: 3,
      });

      setRecipes(result.recipes);
      setSummary(result.summary);
      setPantryStaples(result.pantryStaples);
      setDetailsById({});
      setDetailErrors({});

      if (result.fallback) {
        setError(result.fallbackReason ?? 'AI was unavailable, so fallback recipes were generated.');
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to generate recipes.'));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate(recipe: RecipeSuggestion) {
    if (!token || regeneratingRecipeId) return;

    setRegeneratingRecipeId(recipe.id);
    setError(null);

    try {
      const result = await generateRecipes(token, {
        mode,
        inventoryItemIds: selectedItemIds,
        preferences,
        maxRecipes: 1,
        excludedRecipeTitles: Array.from(new Set([recipe.title, ...recipes.map((item) => item.title)])),
      });
      const replacement = result.recipes[0];

      if (!replacement) {
        throw new Error('No replacement recipe was generated.');
      }

      setRecipes((current) =>
        current.map((item) => (item.id === recipe.id ? replacement : item)),
      );
      setSummary(result.summary);
      setPantryStaples(result.pantryStaples);
      setExpandedRecipeId(null);
      setDetailsById((current) => {
        const next = { ...current };
        delete next[recipe.id];
        return next;
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to regenerate recipe.'));
    } finally {
      setRegeneratingRecipeId(null);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      title="Recipes"
      subtitle="Generate pantry-friendly meals from the inventory synced to your account.">
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Recipe source</Text>
            <View style={styles.optionRow}>
              {MODE_OPTIONS.map((option) => (
                <OptionPill
                  key={option.value}
                  label={option.label}
                  onPress={setMode}
                  selected={mode === option.value}
                  value={option.value}
                />
              ))}
            </View>

            {mode === 'selected' ? (
              <InventorySelection
                items={usableInventory}
                selectedIds={selectedItemIds}
                onToggle={toggleSelectedItem}
              />
            ) : null}

            <View style={styles.sourceFooter}>
              <Text style={[styles.sourceFooterText, { color: colors.mutedText }]}>
                {activeInventory.length} item{activeInventory.length === 1 ? '' : 's'} in source
              </Text>
              {emptyReason ? (
                <Text style={[styles.sourceFooterText, { color: colors.danger }]}>{emptyReason}</Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Preferences</Text>
            <View style={styles.optionRow}>
              {MEAL_OPTIONS.map((option) => (
                <OptionPill
                  key={option.value}
                  label={option.label}
                  onPress={setMealType}
                  selected={mealType === option.value}
                  value={option.value}
                />
              ))}
            </View>
            <View style={styles.optionRow}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <OptionPill
                  key={option.value}
                  label={option.label}
                  onPress={setDifficulty}
                  selected={difficulty === option.value}
                  value={option.value}
                />
              ))}
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Cuisine</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setCuisine}
                  placeholder="Any"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={cuisine}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Dietary</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setDietary}
                  placeholder="Vegetarian, low sugar"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={dietary}
                />
              </View>
              <View style={styles.compactInputs}>
                <View style={[styles.inputGroup, styles.compactInput]}>
                  <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Max min</Text>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={setMaxCookTime}
                    placeholder="30"
                    placeholderTextColor={colors.placeholder}
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    value={maxCookTime}
                  />
                </View>
                <View style={[styles.inputGroup, styles.compactInput]}>
                  <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Servings</Text>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={setServings}
                    placeholder="2"
                    placeholderTextColor={colors.placeholder}
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    value={servings}
                  />
                </View>
              </View>
            </View>

            <Button
              disabled={!canGenerate}
              onPress={() => {
                void handleGenerate();
              }}
              title={isGenerating ? 'Generating...' : 'Generate recipes'}
            />
          </View>

          {error ? (
            <View style={[styles.feedbackBox, { borderColor: colors.danger }]}>
              <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {summary ? (
            <View style={[styles.feedbackBox, { borderColor: colors.tint }]}>
              <Text style={[styles.feedbackText, { color: colors.text }]}>{summary}</Text>
            </View>
          ) : null}

          {pantryStaples.length > 0 ? (
            <View style={styles.staplesRow}>
              {pantryStaples.map((item) => (
                <View key={item} style={[styles.staplePill, { borderColor: colors.border }]}>
                  <Text style={[styles.stapleText, { color: colors.mutedText }]}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {favoriteRecipes.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Saved</Text>
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  detail={detailsById[recipe.id]}
                  detailError={detailErrors[recipe.id]}
                  isExpanded={expandedRecipeId === recipe.id}
                  isLoadingDetail={loadingDetailId === recipe.id}
                  isSaving={savingRecipeId === recipe.id}
                  key={`favorite-${recipe.id}`}
                  recipe={recipe}
                  onFavorite={handleFavorite}
                  onToggle={(item) => {
                    void handleToggleRecipe(item);
                  }}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Recommendations</Text>
            {isGenerating ? (
              <View style={[styles.generatingBox, { borderColor: colors.border }]}>
                <ActivityIndicator color={colors.tint} />
                <Text style={[styles.generatingText, { color: colors.mutedText }]}>
                  Building recipe ideas from {activeInventory.length} inventory item
                  {activeInventory.length === 1 ? '' : 's'}.
                </Text>
              </View>
            ) : null}

            {!isGenerating && recipes.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes yet</Text>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Generate a set once your source has usable inventory items.
                </Text>
              </View>
            ) : null}

            {recipes.map((recipe) => (
              <RecipeCard
                detail={detailsById[recipe.id]}
                detailError={detailErrors[recipe.id]}
                isExpanded={expandedRecipeId === recipe.id}
                isLoadingDetail={loadingDetailId === recipe.id}
                isSaving={savingRecipeId === recipe.id}
                key={recipe.id}
                recipe={recipe}
                onFavorite={handleFavorite}
                onRegenerate={
                  regeneratingRecipeId === recipe.id
                    ? undefined
                    : (item) => {
                        void handleRegenerate(item);
                      }
                }
                onToggle={(item) => {
                  void handleToggleRecipe(item);
                }}
              />
            ))}
          </View>

          <Button title="Refresh" variant="secondary" onPress={loadRecipeData} />
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
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
  inventorySelector: {
    gap: 8,
  },
  inventoryChoice: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  inventoryChoiceText: {
    flex: 1,
    gap: 2,
  },
  inventoryName: {
    fontSize: 15,
    fontWeight: '800',
  },
  inventoryMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  expiringBadge: {
    borderRadius: 999,
    backgroundColor: '#FFF4D7',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  expiringBadgeText: {
    color: '#8A5A00',
    fontSize: 11,
    fontWeight: '800',
  },
  sourceFooter: {
    gap: 4,
  },
  sourceFooterText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  inputGrid: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  compactInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  compactInput: {
    flex: 1,
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
  staplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  staplePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stapleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  generatingBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
  generatingText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
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
});
