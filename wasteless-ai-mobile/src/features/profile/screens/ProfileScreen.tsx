import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { NotificationPreferencesPanel } from '@/features/notifications/components/NotificationPreferencesPanel';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ROUTES } from '@/navigation/routes';
import { useAuth } from '@/store/authStore';

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isSubmitting, logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace(ROUTES.login);
  }

  return (
    <Screen title="Profile" subtitle="Account details for your WasteLessAI session.">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Signed in as</Text>
        <Text style={[styles.value, { color: colors.text }]}>{user?.name ?? 'Unknown user'}</Text>
        <Text style={[styles.caption, { color: colors.mutedText }]}>{user?.email ?? ''}</Text>
      </View>
      <View style={styles.section}>
        <NotificationPreferencesPanel />
      </View>
      <Button
        disabled={isSubmitting}
        title={isSubmitting ? 'Signing out...' : 'Sign out'}
        variant="secondary"
        style={styles.button}
        onPress={handleLogout}
      />
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
  section: {
    marginTop: 24,
  },
});
