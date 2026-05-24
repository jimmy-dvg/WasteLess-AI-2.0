import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ROUTES } from '@/navigation/routes';

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen
      title="WasteLessAI"
      subtitle="Sign in to manage your pantry, track expirations, and reduce household waste.">
      <View style={styles.form}>
        <Input
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          textContentType="emailAddress"
          value={email}
        />
        <Input
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        <Button title="Log in" onPress={() => router.replace(ROUTES.dashboard)} />
        <Button
          title="Create an account"
          variant="ghost"
          onPress={() => router.push(ROUTES.register)}
        />
      </View>
      <Text style={[styles.helperText, { color: colors.mutedText }]}>
        Authentication is scaffolded only. Backend sign-in will be connected later.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  helperText: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
