import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  INVENTORY_STATUS_FILTERS,
  STORAGE_ZONES,
  type InventoryCategory,
  type InventoryFilters as InventoryFilterValues,
  type InventoryStatusFilter,
  type StorageZone,
} from '../types';

type InventoryFiltersProps = {
  categories: InventoryCategory[];
  filters: InventoryFilterValues;
  locations: StorageZone[];
  onChange: (filters: Partial<InventoryFilterValues>) => void;
};

const STATUS_LABELS: Record<InventoryStatusFilter, string> = {
  all: 'All',
  fresh: 'Fresh',
  expiring: 'Soon',
  expired: 'Expired',
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.tint : colors.surface,
          borderColor: active ? colors.tint : colors.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.chipText, { color: active ? colors.onTint : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InventoryFilters({
  categories,
  filters,
  locations,
  onChange,
}: InventoryFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const storageOptions = uniqueValues(['all', ...STORAGE_ZONES, ...locations]);

  return (
    <View style={styles.container}>
      <Input
        autoCapitalize="none"
        autoCorrect={false}
        label="Search"
        onChangeText={(query) => onChange({ query })}
        placeholder="Search by item name"
        returnKeyType="search"
        value={filters.query}
      />

      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {INVENTORY_STATUS_FILTERS.map((status) => (
              <Chip
                key={status}
                active={filters.status === status}
                label={STATUS_LABELS[status]}
                onPress={() => onChange({ status })}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {categories.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              <Chip
                active={filters.categoryId === 'all'}
                label="All"
                onPress={() => onChange({ categoryId: 'all' })}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  active={filters.categoryId === category.id}
                  label={category.name}
                  onPress={() => onChange({ categoryId: category.id })}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Storage</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {storageOptions.map((location) => (
              <Chip
                key={location}
                active={filters.location === location}
                label={location === 'all' ? 'All' : location}
                onPress={() => onChange({ location: location as StorageZone | 'all' })}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minHeight: 38,
    maxWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
