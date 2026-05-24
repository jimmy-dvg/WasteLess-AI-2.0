import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ROUTES } from '@/navigation/routes';

export function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen
      title="Create Account"
      subtitle="Set up your WasteLessAI profile. Real registration will be wired to the backend later.">
      <View style={styles.form}>
        <Input
          autoCapitalize="words"
          autoComplete="name"
          label="Name"
          onChangeText={setName}
          placeholder="Your name"
          textContentType="name"
          value={name}
        />
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
          placeholder="Create a password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <Button title="Create account" onPress={() => router.replace(ROUTES.dashboard)} />
        <Button title="Back to login" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
