import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Screen title="Profile" subtitle="Account details and household preferences will appear here.">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Signed in as</Text>
        <Text style={[styles.value, { color: colors.text }]}>Demo User</Text>
        <Text style={[styles.caption, { color: colors.mutedText }]}>
          This is placeholder account information until authentication is implemented.
        </Text>
      </View>
      <Button title="Sign out" variant="secondary" disabled style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 16,
  },
});
