import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { createCategory, deleteCategory, listCategories, suggestProductStorage } from '../api';
import type { Category, StorageSuggestion } from '../types';

const COLOR_SWATCHES = ['#22c55e', '#f97316', '#38bdf8', '#eab308', '#ef4444', '#64748b'];

const STORAGE_ZONES = [
  { name: 'Fridge', description: 'Cold storage for dairy, opened food, meat, and delicate produce.' },
  { name: 'Freezer', description: 'Frozen products and long-term portions.' },
  { name: 'Pantry', description: 'Dry, dark storage for shelf-stable products.' },
  { name: 'Cabinet', description: 'Everyday dry goods, spices, grains, and cans.' },
  { name: 'Other', description: 'Overflow and products that do not fit a main zone.' },
];

function CategoryRow({
  category,
  disabled,
  onDelete,
}: {
  category: Category;
  disabled: boolean;
  onDelete: (category: Category) => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const swatchColor = category.color ?? colors.tint;

  return (
    <View style={[styles.categoryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
      <View style={styles.categoryCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{category.name}</Text>
        <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
          {category.color ?? 'No custom color'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${category.name}`}
        disabled={disabled}
        onPress={() => onDelete(category)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.iconButton,
          { borderColor: colors.border },
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
        ]}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

export function CategoriesZonesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [productName, setProductName] = useState('');
  const [suggestion, setSuggestion] = useState<StorageSuggestion | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const normalizedCategoryNames = useMemo(
    () => new Set(categories.map((category) => category.name.trim().toLowerCase())),
    [categories],
  );

  const loadCategories = useCallback(
    async (refreshing = false) => {
      if (!token) {
        setError('Sign in to manage categories.');
        setIsLoading(false);
        return;
      }

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        setCategories(await listCategories(token));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load categories.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleCreateCategory() {
    if (!token || isSubmitting) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }

    if (normalizedCategoryNames.has(trimmedName.toLowerCase())) {
      setError('That category already exists.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await createCategory(token, { name: trimmedName, color });
      if (created) setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setFeedback(`${trimmedName} created.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create category.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDeleteCategory(category: Category) {
    Alert.alert('Delete category?', `Products in ${category.name} will become uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeleteCategory(category);
        },
      },
    ]);
  }

  async function handleDeleteCategory(category: Category) {
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await deleteCategory(token, category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setFeedback(`${category.name} deleted.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete category.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSuggestStorage() {
    if (!token || isSuggesting) return;

    const trimmedName = productName.trim();
    if (trimmedName.length < 2) {
      setError('Product name must be at least 2 characters.');
      return;
    }

    setIsSuggesting(true);
    setError(null);
    setSuggestion(null);

    try {
      setSuggestion(await suggestProductStorage(token, trimmedName));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to suggest storage.'));
    } finally {
      setIsSuggesting(false);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void loadCategories(true);
          }}
          tintColor={colors.tint}
        />
      }
      title="Categories & Zones"
      subtitle="Create inventory categories and use storage zones to keep products easy to find.">
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Add category</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Produce, dairy, snacks"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={name}
            />
            <View style={styles.swatchRow}>
              {COLOR_SWATCHES.map((swatch) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: color === swatch }}
                  key={swatch}
                  onPress={() => setColor(swatch)}
                  style={[
                    styles.colorChoice,
                    {
                      backgroundColor: swatch,
                      borderColor: color === swatch ? colors.text : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Button
              disabled={isSubmitting}
              title={isSubmitting ? 'Saving...' : 'Add category'}
              onPress={() => {
                void handleCreateCategory();
              }}
            />
          </View>

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Storage suggestion</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setProductName}
              placeholder="Tomatoes, yogurt, rice"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={productName}
            />
            <Button
              disabled={isSuggesting}
              title={isSuggesting ? 'Checking...' : 'Suggest category and zone'}
              variant="secondary"
              onPress={() => {
                void handleSuggestStorage();
              }}
            />
            {suggestion ? (
              <View style={[styles.suggestionBox, { borderColor: colors.tint }]}>
                <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                  {suggestion.productName || productName}
                </Text>
                <Text style={[styles.suggestionText, { color: colors.mutedText }]}>
                  {suggestion.category} - {suggestion.storageZone}
                </Text>
                <Text style={[styles.suggestionReason, { color: colors.mutedText }]}>
                  {suggestion.reason}
                </Text>
              </View>
            ) : null}
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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your categories</Text>
            {categories.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Add a category to start grouping inventory items.
                </Text>
              </View>
            ) : (
              categories.map((category) => (
                <CategoryRow
                  category={category}
                  disabled={isSubmitting}
                  key={category.id}
                  onDelete={confirmDeleteCategory}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage zones</Text>
            {STORAGE_ZONES.map((zone) => (
              <View key={zone.name} style={[styles.zoneCard, { borderColor: colors.border }]}>
                <Ionicons name="cube-outline" size={18} color={colors.tint} />
                <View style={styles.zoneCopy}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{zone.name}</Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedText }]}>{zone.description}</Text>
                </View>
              </View>
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
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChoice: {
    width: 34,
    height: 34,
    borderWidth: 3,
    borderRadius: 8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  categoryRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  swatch: {
    width: 16,
    height: 42,
    borderRadius: 8,
  },
  categoryCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  suggestionBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 5,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  suggestionReason: {
    fontSize: 13,
    lineHeight: 19,
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
  emptyBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  zoneCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  zoneCopy: {
    flex: 1,
    gap: 3,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
