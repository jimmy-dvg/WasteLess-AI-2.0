import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RecipeIngredient, RecipeSuggestion } from '../types';

type RecipeCardProps = {
  recipe: RecipeSuggestion;
  detail?: RecipeSuggestion | null;
  detailError?: string | null;
  isExpanded: boolean;
  isAddingMissing?: boolean;
  isLoadingDetail?: boolean;
  isSaving?: boolean;
  onAddMissingToShopping?: (recipe: RecipeSuggestion) => void;
  onFavorite: (recipe: RecipeSuggestion) => void;
  onRegenerate?: (recipe: RecipeSuggestion) => void;
  onToggle: (recipe: RecipeSuggestion) => void;
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function formatIngredient(ingredient: RecipeIngredient) {
  return [ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(' ');
}

function formatMacro(value: number | undefined, suffix = '') {
  if (value == null) return '0';
  return `${Math.round(value)}${suffix}`;
}

function IngredientsList({
  ingredients,
  title,
  tone,
}: {
  ingredients: RecipeIngredient[];
  title: string;
  tone: 'available' | 'missing';
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const toneStyle = tone === 'available' ? styles.availableBadge : styles.missingBadge;
  const iconName = tone === 'available' ? 'checkmark-circle-outline' : 'add-circle-outline';

  if (ingredients.length === 0) return null;

  return (
    <View style={styles.detailSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.ingredientList}>
        {ingredients.map((ingredient) => (
          <View
            key={`${tone}-${ingredient.name}-${ingredient.quantity ?? ''}`}
            style={[styles.ingredientRow, { borderColor: colors.border }]}>
            <Ionicons
              name={iconName}
              size={18}
              color={tone === 'available' ? colors.tint : '#A15C00'}
            />
            <View style={styles.ingredientTextGroup}>
              <Text style={[styles.ingredientName, { color: colors.text }]}>
                {formatIngredient(ingredient)}
              </Text>
              {ingredient.isExpiring || ingredient.isOptional || ingredient.notes ? (
                <Text style={[styles.ingredientNote, { color: colors.mutedText }]}>
                  {[
                    ingredient.isExpiring ? 'expiring soon' : null,
                    ingredient.isOptional ? 'optional' : null,
                    ingredient.notes,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              ) : null}
            </View>
            <View style={toneStyle}>
              <Text style={tone === 'available' ? styles.availableText : styles.missingText}>
                {tone === 'available' ? 'In inventory' : 'Missing'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RecipeCard({
  detail,
  detailError,
  isAddingMissing = false,
  isExpanded,
  isLoadingDetail = false,
  isSaving = false,
  onAddMissingToShopping,
  onFavorite,
  onRegenerate,
  onToggle,
  recipe,
}: RecipeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const activeRecipe = detail ?? recipe;
  const steps = activeRecipe.steps;
  const availableCount = activeRecipe.ingredients.length;
  const missingCount = activeRecipe.missingIngredients.length;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.source, { color: colors.tint }]}>{recipe.source.replace(/_/g, ' ')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>
        </View>
        <Pressable
          accessibilityLabel={recipe.isSaved ? 'Remove saved recipe' : 'Save recipe'}
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => onFavorite(recipe)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.iconButton,
            { borderColor: colors.border },
            recipe.isSaved ? styles.savedButton : null,
            pressed && !isSaving ? styles.pressed : null,
            isSaving ? styles.disabled : null,
          ]}>
          <Ionicons
            name={recipe.isSaved ? 'heart' : 'heart-outline'}
            size={20}
            color={recipe.isSaved ? colors.tint : colors.mutedText}
          />
        </Pressable>
      </View>

      <Text style={[styles.description, { color: colors.mutedText }]}>{recipe.description}</Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, { borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={15} color={colors.mutedText} />
          <Text style={[styles.metaText, { color: colors.text }]}>{recipe.cookTime} min</Text>
        </View>
        <View style={[styles.metaPill, { borderColor: colors.border }]}>
          <Ionicons name="restaurant-outline" size={15} color={colors.mutedText} />
          <Text style={[styles.metaText, { color: colors.text }]}>
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </Text>
        </View>
        <View style={[styles.metaPill, { borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={15} color={colors.mutedText} />
          <Text style={[styles.metaText, { color: colors.text }]}>{recipe.servings}</Text>
        </View>
      </View>

      <View style={styles.matchRow}>
        <Text style={[styles.matchText, { color: colors.tint }]}>
          {availableCount} inventory ingredient{availableCount === 1 ? '' : 's'}
        </Text>
        <Text style={[styles.matchText, { color: missingCount > 0 ? '#A15C00' : colors.tint }]}>
          {missingCount} missing
        </Text>
        {recipe.score != null ? (
          <Text style={[styles.matchText, { color: colors.mutedText }]}>
            {Math.round(recipe.score)} match
          </Text>
        ) : null}

        {onAddMissingToShopping && missingCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            disabled={isAddingMissing}
            onPress={() => onAddMissingToShopping(recipe)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionButton,
              styles.secondaryAction,
              { borderColor: colors.border },
              pressed && !isAddingMissing ? styles.pressed : null,
              isAddingMissing ? styles.disabled : null,
            ]}>
            {isAddingMissing ? (
              <ActivityIndicator color={colors.tint} size="small" />
            ) : (
              <Ionicons name="cart-outline" size={18} color={colors.tint} />
            )}
            <Text style={[styles.secondaryActionText, { color: colors.tint }]}>Add gaps</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onToggle(recipe)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.actionButton,
            { backgroundColor: colors.tint, borderColor: colors.tint },
            pressed ? styles.pressed : null,
          ]}>
          <Ionicons
            name={isExpanded ? 'chevron-up-outline' : 'book-outline'}
            size={18}
            color={colors.onTint}
          />
          <Text style={[styles.actionButtonText, { color: colors.onTint }]}>
            {isExpanded ? 'Close' : 'Details'}
          </Text>
        </Pressable>

        {onRegenerate ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onRegenerate(recipe)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionButton,
              styles.secondaryAction,
              { borderColor: colors.border },
              pressed ? styles.pressed : null,
            ]}>
            <Ionicons name="refresh-outline" size={18} color={colors.tint} />
            <Text style={[styles.secondaryActionText, { color: colors.tint }]}>Again</Text>
          </Pressable>
        ) : null}
      </View>

      {isExpanded ? (
        <View style={[styles.details, { borderTopColor: colors.border }]}>
          {isLoadingDetail ? (
            <View style={styles.loadingDetails}>
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.detailMuted, { color: colors.mutedText }]}>Loading full recipe</Text>
            </View>
          ) : null}

          {detailError ? (
            <View style={[styles.errorBox, { borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{detailError}</Text>
            </View>
          ) : null}

          {!isLoadingDetail ? (
            <>
              <View style={styles.nutritionGrid}>
                <View style={[styles.nutritionTile, { backgroundColor: colors.background }]}>
                  <Text style={[styles.nutritionLabel, { color: colors.mutedText }]}>Kcal</Text>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {formatMacro(activeRecipe.nutrition.caloriesKcal)}
                  </Text>
                </View>
                <View style={[styles.nutritionTile, { backgroundColor: colors.background }]}>
                  <Text style={[styles.nutritionLabel, { color: colors.mutedText }]}>Protein</Text>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {formatMacro(activeRecipe.nutrition.proteinG, 'g')}
                  </Text>
                </View>
                <View style={[styles.nutritionTile, { backgroundColor: colors.background }]}>
                  <Text style={[styles.nutritionLabel, { color: colors.mutedText }]}>Carbs</Text>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {formatMacro(activeRecipe.nutrition.carbsG, 'g')}
                  </Text>
                </View>
                <View style={[styles.nutritionTile, { backgroundColor: colors.background }]}>
                  <Text style={[styles.nutritionLabel, { color: colors.mutedText }]}>Fat</Text>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {formatMacro(activeRecipe.nutrition.fatG, 'g')}
                  </Text>
                </View>
              </View>

              <IngredientsList
                ingredients={activeRecipe.ingredients}
                title="Available from inventory"
                tone="available"
              />
              <IngredientsList
                ingredients={activeRecipe.missingIngredients}
                title="Missing optional ingredients"
                tone="missing"
              />

              {steps.length > 0 ? (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Steps</Text>
                  <View style={styles.stepsList}>
                    {steps.map((step) => (
                      <View
                        key={`${activeRecipe.id}-step-${step.order}`}
                        style={[styles.stepRow, { borderColor: colors.border }]}>
                        <Text style={[styles.stepNumber, { color: colors.tint }]}>{step.order}</Text>
                        <Text style={[styles.stepText, { color: colors.text }]}>{step.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {activeRecipe.wasteReductionNote ? (
                <View style={[styles.wasteNote, { backgroundColor: colors.background }]}>
                  <Ionicons name="leaf-outline" size={18} color={colors.tint} />
                  <Text style={[styles.wasteText, { color: colors.text }]}>
                    {activeRecipe.wasteReductionNote}
                  </Text>
                </View>
              ) : null}

              {activeRecipe.warnings.length > 0 ? (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
                  {activeRecipe.warnings.map((warning) => (
                    <Text
                      key={`${warning.type}-${warning.message}`}
                      style={[styles.detailMuted, { color: colors.mutedText }]}>
                      {warning.message}
                    </Text>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 5,
  },
  source: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  savedButton: {
    backgroundColor: '#E7F7ED',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
  details: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 16,
  },
  loadingDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  detailMuted: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionTile: {
    minWidth: 74,
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  ingredientList: {
    gap: 8,
  },
  ingredientRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  ingredientTextGroup: {
    flex: 1,
    gap: 2,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  ingredientNote: {
    fontSize: 12,
    lineHeight: 16,
  },
  availableBadge: {
    borderRadius: 999,
    backgroundColor: '#E7F7ED',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  availableText: {
    color: '#17663A',
    fontSize: 11,
    fontWeight: '800',
  },
  missingBadge: {
    borderRadius: 999,
    backgroundColor: '#FFF4D7',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  missingText: {
    color: '#8A5A00',
    fontSize: 11,
    fontWeight: '800',
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  stepNumber: {
    width: 24,
    fontSize: 16,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  wasteNote: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    gap: 9,
  },
  wasteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
