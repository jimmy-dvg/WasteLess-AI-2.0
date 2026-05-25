import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { InventoryItem } from '../types';

type InventoryItemCardProps = {
  item: InventoryItem;
  disabled?: boolean;
  onDelete: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
};

const STATUS_LABELS = {
  fresh: 'Fresh',
  expiring: 'Expiring soon',
  expired: 'Expired',
};

const STATUS_COLORS = {
  fresh: {
    backgroundColor: '#E7F7ED',
    color: '#17663A',
  },
  expiring: {
    backgroundColor: '#FFF4D7',
    color: '#8A5A00',
  },
  expired: {
    backgroundColor: '#FEE4E2',
    color: '#B42318',
  },
};

function cleanQuantity(quantity: string) {
  if (!quantity.includes('.')) return quantity;
  return quantity.replace(/\.?0+$/, '');
}

function formatQuantity(item: InventoryItem) {
  return [cleanQuantity(item.quantity), item.unit].filter(Boolean).join(' ');
}

function formatDate(value: string | null) {
  if (!value) return 'No expiration date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No expiration date';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function InventoryItemCard({ disabled, item, onDelete, onEdit }: InventoryItemCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const statusColors = STATUS_COLORS[item.status];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.quantity, { color: colors.mutedText }]}>
            {formatQuantity(item) || '0'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColors.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: statusColors.color }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: colors.mutedText }]}>Category</Text>
          <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
            {item.categoryName ?? 'Uncategorized'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: colors.mutedText }]}>Storage</Text>
          <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
            {item.storageLocation ?? 'pantry'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: colors.mutedText }]}>Expiration</Text>
          <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
            {formatDate(item.expirationDate)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`Edit ${item.name}`}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onEdit(item)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.iconButton,
            { borderColor: colors.border },
            pressed && !disabled ? styles.pressed : null,
            disabled ? styles.disabled : null,
          ]}>
          <Ionicons name="create-outline" size={20} color={colors.tint} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Delete ${item.name}`}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onDelete(item)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.iconButton,
            { borderColor: colors.border },
            pressed && !disabled ? styles.pressed : null,
            disabled ? styles.disabled : null,
          ]}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
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
  name: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  quantity: {
    fontSize: 15,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaGrid: {
    gap: 10,
  },
  metaItem: {
    gap: 3,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
