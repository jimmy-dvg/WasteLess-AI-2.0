import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import {
  addMealPlanShoppingItems,
  getMealPlanData,
  saveMealPlan,
  updateMealPlanItem,
} from '../api';
import type { MealPlanDay, MealPlanOptions, MealPlanningData, SavedMealPlanItem } from '../types';

const DAY_OPTIONS = [3, 5, 7];

function formatIngredients(items: { name: string }[]) {
  return items.map((item) => item.name).filter(Boolean).join(', ');
}

function OptionPill({
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
        styles.optionPill,
        {
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.optionText, { color: selected ? colors.onTint : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function MealCard({ meal }: { meal: MealPlanDay }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const missing = formatIngredients(meal.missingItems);
  const priority = meal.priorityItems.join(', ');

  return (
    <View style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleGroup}>
          <Text style={[styles.mealDate, { color: colors.tint }]}>{meal.dateLabel}</Text>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{meal.title}</Text>
        </View>
        <Text style={[styles.scoreText, { color: colors.mutedText }]}>{Math.round(meal.score)}%</Text>
      </View>
      <Text style={[styles.mealDescription, { color: colors.mutedText }]}>{meal.description}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: colors.mutedText }]}>{meal.cookTime} min</Text>
        <Text style={[styles.metaText, { color: colors.mutedText }]}>{meal.servings} servings</Text>
        <Text style={[styles.metaText, { color: colors.mutedText }]}>
          {Math.round(meal.inventoryCoverage * 100)}% covered
        </Text>
      </View>
      {priority ? (
        <Text style={[styles.detailText, { color: colors.text }]}>Use first: {priority}</Text>
      ) : null}
      {missing ? (
        <Text style={[styles.detailText, { color: colors.mutedText }]}>Missing: {missing}</Text>
      ) : null}
    </View>
  );
}

function SavedMealCard({
  disabled,
  item,
  onAction,
}: {
  disabled: boolean;
  item: SavedMealPlanItem;
  onAction: (item: SavedMealPlanItem, action: 'cooked' | 'skipped' | 'planned') => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isPlanned = item.status === 'planned';
  const missing = formatIngredients(item.missingItems);

  return (
    <View style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleGroup}>
          <Text style={[styles.mealDate, { color: colors.tint }]}>{item.dateLabel}</Text>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.mutedText }]}>{item.status}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.mealDescription, { color: colors.mutedText }]}>{item.description}</Text>
      ) : null}
      {missing ? (
        <Text style={[styles.detailText, { color: colors.mutedText }]}>Missing: {missing}</Text>
      ) : null}
      <View style={styles.actionRow}>
        {isPlanned ? (
          <>
            <Button
              disabled={disabled}
              title="Cooked"
              style={styles.actionButton}
              onPress={() => onAction(item, 'cooked')}
            />
            <Button
              disabled={disabled}
              title="Skip"
              variant="secondary"
              style={styles.actionButton}
              onPress={() => onAction(item, 'skipped')}
            />
          </>
        ) : (
          <Button
            disabled={disabled}
            title="Reopen"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => onAction(item, 'planned')}
          />
        )}
      </View>
    </View>
  );
}

export function MealPlanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [options, setOptions] = useState<MealPlanOptions>({ days: 5, inventoryOnly: false });
  const [data, setData] = useState<MealPlanningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const stats = useMemo(
    () =>
      data
        ? [
            { label: 'Meals', value: data.stats.plannedMeals },
            { label: 'Expiring used', value: data.stats.expiringUsed },
            { label: 'Shopping adds', value: data.stats.addableShoppingItems },
            { label: 'Already listed', value: data.stats.alreadyListedItems },
          ]
        : [],
    [data],
  );

  const loadPlan = useCallback(
    async (refreshing = false) => {
      if (!token) {
        setError('Sign in to view your meal plan.');
        setIsLoading(false);
        return;
      }

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        setData(await getMealPlanData(token, options));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load meal plan.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [options, token],
  );

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  async function runMealPlanAction(action: 'save' | 'shopping') {
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const message =
        action === 'save'
          ? await saveMealPlan(token, options)
          : await addMealPlanShoppingItems(token, options);
      setFeedback(message);
      await loadPlan(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update meal plan.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSavedItemAction(
    item: SavedMealPlanItem,
    action: 'cooked' | 'skipped' | 'planned',
  ) {
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      setFeedback(await updateMealPlanItem(token, item.id, action));
      await loadPlan(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update meal.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void loadPlan(true);
          }}
          tintColor={colors.tint}
        />
      }
      title="Meal Plan"
      subtitle="Build low-waste meal ideas from expiring inventory and saved recipes.">
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Plan controls</Text>
        <View style={styles.optionRow}>
          {DAY_OPTIONS.map((day) => (
            <OptionPill
              key={day}
              label={`${day} days`}
              onPress={() => setOptions((current) => ({ ...current, days: day }))}
              selected={options.days === day}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: options.inventoryOnly }}
          onPress={() =>
            setOptions((current) => ({ ...current, inventoryOnly: !current.inventoryOnly }))
          }
          style={({ pressed }: { pressed: boolean }) => [
            styles.toggleRow,
            { borderColor: colors.border },
            pressed ? styles.pressed : null,
          ]}>
          <Ionicons
            name={options.inventoryOnly ? 'checkbox-outline' : 'square-outline'}
            size={22}
            color={colors.tint}
          />
          <Text style={[styles.toggleText, { color: colors.text }]}>Use inventory only</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={[styles.feedbackBox, { borderColor: colors.danger }]}>
          <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && feedback ? (
        <View style={[styles.feedbackBox, { borderColor: colors.tint }]}>
          <Text style={[styles.feedbackText, { color: colors.text }]}>{feedback}</Text>
        </View>
      ) : null}

      {!isLoading && data ? (
        <>
          <View style={styles.statsGrid}>
            {stats.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              disabled={isSubmitting || data.planDays.length === 0}
              title={isSubmitting ? 'Saving...' : 'Save plan'}
              style={styles.actionButton}
              onPress={() => {
                void runMealPlanAction('save');
              }}
            />
            <Button
              disabled={isSubmitting}
              title="Add shopping"
              variant="secondary"
              style={styles.actionButton}
              onPress={() => {
                void runMealPlanAction('shopping');
              }}
            />
          </View>

          {data.savedPlan ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{data.savedPlan.name}</Text>
              {data.savedPlan.items.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                  <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                    Saved meals will appear here after a plan is created.
                  </Text>
                </View>
              ) : (
                data.savedPlan.items.map((item) => (
                  <SavedMealCard
                    disabled={isSubmitting}
                    item={item}
                    key={item.id}
                    onAction={(meal, action) => {
                      void handleSavedItemAction(meal, action);
                    }}
                  />
                ))
              )}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended plan</Text>
            {data.planDays.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Add inventory items or saved recipes to generate a meal plan.
                </Text>
              </View>
            ) : (
              data.planDays.map((meal) => <MealCard key={meal.id} meal={meal} />)
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Needs attention</Text>
            {[...data.expiringItems, ...data.lowStockItems].slice(0, 5).map((item) => (
              <View key={item.id} style={[styles.focusItem, { borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={18} color={colors.tint} />
                <View style={styles.focusCopy}>
                  <Text style={[styles.detailText, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.metaText, { color: colors.mutedText }]}>
                    {item.quantityLabel} - {item.relativeExpiration || item.location}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 16,
  },
  centerState: {
    minHeight: 220,
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
  toggleRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 130,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 23,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 130,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  mealCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealTitleGroup: {
    flex: 1,
    gap: 3,
  },
  mealDate: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  focusItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  focusCopy: {
    flex: 1,
    gap: 2,
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
  pressed: {
    opacity: 0.72,
  },
});
