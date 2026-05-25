import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ShoppingItemSource, ShoppingListItem } from '../types';

type ShoppingItemCardProps = {
  item: ShoppingListItem;
  disabled?: boolean;
  onDelete: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
  onToggle: (item: ShoppingListItem) => void;
};

const SOURCE_LABELS: Record<ShoppingItemSource, string> = {
  manual: 'Manual',
  recipe: 'Recipe',
  'low-stock': 'Low stock',
};

const SOURCE_COLORS: Record<ShoppingItemSource, { background: string; text: string }> = {
  manual: { background: '#EEF2FF', text: '#3730A3' },
  recipe: { background: '#FFF4D7', text: '#8A5A00' },
  'low-stock': { background: '#E7F7ED', text: '#17663A' },
};

function formatQuantity(item: ShoppingListItem) {
  if (item.quantity == null) return item.unit ?? '';
  const quantity = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2);
  return [quantity.replace(/\.00$/, ''), item.unit].filter(Boolean).join(' ');
}

export function ShoppingItemCard({
  disabled,
  item,
  onDelete,
  onEdit,
  onToggle,
}: ShoppingItemCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const sourceColors = SOURCE_COLORS[item.source];
  const quantity = formatQuantity(item);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: item.checked ? colors.border : colors.tint,
        },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked, disabled }}
        disabled={disabled}
        onPress={() => onToggle(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.checkButton,
          { borderColor: item.checked ? colors.tint : colors.border },
          item.checked ? { backgroundColor: colors.tint } : null,
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
        ]}>
        <Ionicons
          name={item.checked ? 'checkmark' : 'ellipse-outline'}
          size={22}
          color={item.checked ? colors.onTint : colors.mutedText}
        />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.name,
              { color: item.checked ? colors.mutedText : colors.text },
              item.checked ? styles.checkedText : null,
            ]}>
            {item.name}
          </Text>
          <View style={[styles.sourceBadge, { backgroundColor: sourceColors.background }]}>
            <Text style={[styles.sourceText, { color: sourceColors.text }]}>
              {SOURCE_LABELS[item.source]}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {quantity ? (
            <Text style={[styles.metaText, { color: colors.text }]}>{quantity}</Text>
          ) : null}
          {item.category ? (
            <Text style={[styles.metaText, { color: colors.mutedText }]}>{item.category}</Text>
          ) : null}
        </View>

        {item.note ? (
          <Text numberOfLines={2} style={[styles.note, { color: colors.mutedText }]}>
            {item.note}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onEdit(item)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionButton,
              { borderColor: colors.border },
              pressed && !disabled ? styles.pressed : null,
              disabled ? styles.disabled : null,
            ]}>
            <Ionicons name="create-outline" size={17} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.tint }]}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onDelete(item)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionButton,
              { borderColor: colors.border },
              pressed && !disabled ? styles.pressed : null,
              disabled ? styles.disabled : null,
            ]}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  checkButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
  sourceBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '800',
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
