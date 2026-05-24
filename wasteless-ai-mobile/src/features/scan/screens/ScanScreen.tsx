import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Screen title="Scan" subtitle="Camera, barcode, and OCR workflows will be added later.">
      <View style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.placeholderTitle, { color: colors.text }]}>Scanner placeholder</Text>
        <Text style={[styles.placeholderCopy, { color: colors.mutedText }]}>
          This screen is reserved for future product scanning without requesting camera access yet.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
});
