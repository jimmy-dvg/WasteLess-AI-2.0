import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import type { RegisterFormErrors } from '@/features/auth/utils/validation';
import { hasFormErrors, validateRegisterForm } from '@/features/auth/utils/validation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ROUTES } from '@/navigation/routes';
import { useAuth } from '@/store/authStore';

export function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { clearError, error, isSubmitting, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});

  useEffect(() => {
    clearError();
  }, [clearError]);

  async function handleSubmit() {
    const nextErrors = validateRegisterForm(name, email, password);
    setFieldErrors(nextErrors);
    clearError();

    if (hasFormErrors(nextErrors)) return;

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (result.success) {
      router.replace(ROUTES.dashboard);
    }
  }

  return (
    <Screen
      title="Create Account"
      subtitle="Set up your WasteLessAI profile and start tracking what your household already has.">
      <View style={styles.form}>
        {error ? (
          <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Input
          autoCapitalize="words"
          autoComplete="name"
          error={fieldErrors.name}
          label="Name"
          onChangeText={setName}
          placeholder="Your name"
          textContentType="name"
          value={name}
        />
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
          placeholder="Create a password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <Button
          disabled={isSubmitting}
          title={isSubmitting ? 'Creating account...' : 'Create account'}
          onPress={handleSubmit}
        />
        <Button
          disabled={isSubmitting}
          title="Back to login"
          variant="ghost"
          onPress={() => router.replace(ROUTES.login)}
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
