import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScannerErrorStateProps = {
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
};

export function ScannerErrorState({
  actionTitle,
  message,
  onAction,
  onSecondaryAction,
  secondaryActionTitle,
  title,
}: ScannerErrorStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
      <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.button} />
      ) : null}
      {secondaryActionTitle && onSecondaryAction ? (
        <Button
          title={secondaryActionTitle}
          onPress={onSecondaryAction}
          style={styles.button}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 6,
  },
});
