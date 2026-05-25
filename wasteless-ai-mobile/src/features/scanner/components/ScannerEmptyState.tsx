import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import type { ScanMode } from '@/features/scanner/types';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScannerEmptyStateProps = {
  mode: ScanMode;
  isGalleryBusy: boolean;
  onOpenCamera: () => void;
  onPickImage: () => void;
};

const MODE_CONTENT = {
  product: {
    icon: 'cube-outline',
    title: 'Product photo',
    copy: 'Capture the front label, expiration date, or packaging details.',
  },
  receipt: {
    icon: 'receipt-outline',
    title: 'Receipt photo',
    copy: 'Capture a clear receipt image for OCR and item recognition.',
  },
} as const;

export function ScannerEmptyState({
  isGalleryBusy,
  mode,
  onOpenCamera,
  onPickImage,
}: ScannerEmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const content = MODE_CONTENT[mode];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={content.icon} size={34} color={colors.tint} />
      <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
      <Text style={[styles.copy, { color: colors.mutedText }]}>{content.copy}</Text>
      <View style={styles.actions}>
        <Button title="Open camera" onPress={onOpenCamera} style={styles.actionButton} />
        <Button
          disabled={isGalleryBusy}
          title={isGalleryBusy ? 'Opening gallery...' : 'Choose from gallery'}
          onPress={onPickImage}
          style={styles.actionButton}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    alignSelf: 'stretch',
  },
});
