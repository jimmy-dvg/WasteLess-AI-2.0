import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Screen title="Inventory" subtitle="Saved pantry, fridge, and freezer products will live here.">
      <View style={[styles.emptyState, { borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No products yet</Text>
        <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
          Inventory syncing and product creation will be connected after the mobile foundation is in
          place.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
