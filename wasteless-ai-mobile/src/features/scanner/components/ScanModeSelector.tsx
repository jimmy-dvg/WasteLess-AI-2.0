import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { ScanMode } from '@/features/scanner/types';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScanModeSelectorProps = {
  mode: ScanMode;
  disabled?: boolean;
  onChange: (mode: ScanMode) => void;
};

type ModeOption = {
  mode: ScanMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'product',
    title: 'Product photo',
    description: 'Package, label, or expiration date',
    icon: 'cube-outline',
  },
  {
    mode: 'receipt',
    title: 'Receipt photo',
    description: 'Receipt for future OCR parsing',
    icon: 'receipt-outline',
  },
];

export function ScanModeSelector({ disabled, mode, onChange }: ScanModeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const activeBackground = colorScheme === 'dark' ? '#16331F' : '#E7F7ED';

  return (
    <View style={styles.container}>
      {MODE_OPTIONS.map((option) => {
        const isSelected = mode === option.mode;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: isSelected }}
            disabled={disabled}
            key={option.mode}
            onPress={() => onChange(option.mode)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.option,
              {
                backgroundColor: isSelected ? activeBackground : colors.surface,
                borderColor: isSelected ? colors.tint : colors.border,
              },
              pressed && !disabled ? styles.pressed : null,
              disabled ? styles.disabled : null,
            ]}>
            <View style={[styles.iconWrap, { borderColor: isSelected ? colors.tint : colors.border }]}>
              <Ionicons name={option.icon} size={22} color={isSelected ? colors.tint : colors.icon} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.text }]}>{option.title}</Text>
              <Text style={[styles.description, { color: colors.mutedText }]}>
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  option: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 78,
    padding: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
