import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import type { ScannerImage, ScanMode } from '@/features/scanner/types';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ImagePreviewProps = {
  image: ScannerImage;
  mode: ScanMode;
  isProcessing: boolean;
  placeholderMessage: string | null;
  secondaryActionTitle: string;
  onCancel: () => void;
  onSecondaryAction: () => void;
  onUseImage: () => void;
};

const MODE_LABELS = {
  product: 'Product photo',
  receipt: 'Receipt photo',
} as const;

export function ImagePreview({
  image,
  isProcessing,
  mode,
  onCancel,
  onSecondaryAction,
  onUseImage,
  placeholderMessage,
  secondaryActionTitle,
}: ImagePreviewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={[styles.imageFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image resizeMode="contain" source={{ uri: image.uri }} style={styles.image} />
      </View>

      <View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.modeLabel, { color: colors.mutedText }]}>Selected mode</Text>
        <Text style={[styles.modeValue, { color: colors.text }]}>{MODE_LABELS[mode]}</Text>
        <Text style={[styles.copy, { color: colors.mutedText }]}>
          Review the image before future recognition. This foundation does not upload, store, or
          analyze the image yet.
        </Text>
        {placeholderMessage ? (
          <Text accessibilityLiveRegion="polite" style={[styles.placeholder, { color: colors.tint }]}>
            {placeholderMessage}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          disabled={isProcessing || Boolean(placeholderMessage)}
          title={isProcessing ? 'Preparing preview...' : 'Use this image'}
          onPress={onUseImage}
        />
        <Button
          disabled={isProcessing}
          title={secondaryActionTitle}
          onPress={onSecondaryAction}
          variant="secondary"
        />
        <Button disabled={isProcessing} title="Cancel" onPress={onCancel} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  imageFrame: {
    borderRadius: 8,
    borderWidth: 1,
    height: 360,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  details: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
});
