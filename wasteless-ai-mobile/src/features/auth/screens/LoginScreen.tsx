import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import type { LoginFormErrors } from '@/features/auth/utils/validation';
import { hasFormErrors, validateLoginForm } from '@/features/auth/utils/validation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ROUTES } from '@/navigation/routes';
import { useAuth } from '@/store/authStore';

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { clearError, error, isSubmitting, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});

  useEffect(() => {
    clearError();
  }, [clearError]);

  async function handleSubmit() {
    const nextErrors = validateLoginForm(email, password);
    setFieldErrors(nextErrors);
    clearError();

    if (hasFormErrors(nextErrors)) return;

    const result = await login({ email: email.trim(), password });
    if (result.success) {
      router.replace(ROUTES.dashboard);
    }
  }

  return (
    <Screen
      title="WasteLessAI"
      subtitle="Sign in to manage your pantry, track expirations, and reduce household waste.">
      <View style={styles.form}>
        {error ? (
          <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Input
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          textContentType="emailAddress"
          value={email}
        />
        <Input
          error={fieldErrors.password}
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        <Button
          disabled={isSubmitting}
          title={isSubmitting ? 'Logging in...' : 'Log in'}
          onPress={handleSubmit}
        />
        <Button
          disabled={isSubmitting}
          title="Create an account"
          variant="ghost"
          onPress={() => router.push(ROUTES.register)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
