import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { NotificationPreferences } from '../types';
import { EXPIRING_SOON_THRESHOLDS } from '../types';

type ToggleKey =
  | 'expirationReminders'
  | 'expiredItemReminders'
  | 'lowStockReminders'
  | 'shoppingReminders'
  | 'expoPushNotifications';

function ToggleRow({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.tint }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function getPermissionLabel(status: string, granted: boolean) {
  if (granted) return 'Allowed';
  if (status === 'denied') return 'Denied';
  if (status === 'unsupported') return 'Native only';
  return 'Not allowed';
}

export function NotificationPreferencesPanel() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    enableDeviceNotifications,
    error,
    isLoading,
    isRegistering,
    isSaving,
    permissionState,
    preferences,
    registrationResult,
    savePreferences,
  } = useNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreferences>(preferences);
  const timeIsValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.reminderTime);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const permissionLabel = useMemo(
    () => getPermissionLabel(permissionState.status, permissionState.granted),
    [permissionState],
  );

  function updateToggle(key: ToggleKey, value: boolean) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!timeIsValid) return;
    await savePreferences(draft);
  }

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Reminders</Text>
          <Text style={[styles.caption, { color: colors.mutedText }]}>Permission: {permissionLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isRegistering}
          onPress={enableDeviceNotifications}
          style={({ pressed }) => [
            styles.iconButton,
            { borderColor: colors.border },
            pressed && !isRegistering ? styles.pressed : null,
            isRegistering ? styles.disabled : null,
          ]}>
          <Text style={[styles.iconButtonText, { color: colors.tint }]}>
            {isRegistering ? 'Enabling...' : 'Enable'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.toggleGroup}>
        <ToggleRow
          label="Expiring soon"
          value={draft.expirationReminders}
          onValueChange={(value) => updateToggle('expirationReminders', value)}
        />
        <ToggleRow
          label="Expired items"
          value={draft.expiredItemReminders}
          onValueChange={(value) => updateToggle('expiredItemReminders', value)}
        />
        <ToggleRow
          label="Low stock"
          value={draft.lowStockReminders}
          onValueChange={(value) => updateToggle('lowStockReminders', value)}
        />
        <ToggleRow
          label="Shopping list"
          value={draft.shoppingReminders}
          onValueChange={(value) => updateToggle('shoppingReminders', value)}
        />
        <ToggleRow
          label="Remote push"
          value={draft.expoPushNotifications}
          onValueChange={(value) => updateToggle('expoPushNotifications', value)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Expiring soon window</Text>
        <View style={styles.segmentedControl}>
          {EXPIRING_SOON_THRESHOLDS.map((days) => {
            const selected = draft.expirationWindowDays === days;
            return (
              <Pressable
                key={days}
                accessibilityRole="button"
                onPress={() => setDraft((current) => ({ ...current, expirationWindowDays: days }))}
                style={[
                  styles.segment,
                  {
                    backgroundColor: selected ? colors.tint : colors.background,
                    borderColor: selected ? colors.tint : colors.border,
                  },
                ]}>
                <Text style={[styles.segmentText, { color: selected ? colors.onTint : colors.text }]}>
                  {days} day{days === 1 ? '' : 's'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Reminder time</Text>
        <TextInput
          value={draft.reminderTime}
          onChangeText={(reminderTime) => setDraft((current) => ({ ...current, reminderTime }))}
          placeholder="08:00"
          placeholderTextColor={colors.placeholder}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={[
            styles.timeInput,
            {
              backgroundColor: colors.background,
              borderColor: timeIsValid ? colors.border : colors.danger,
              color: colors.text,
            },
          ]}
        />
        {!timeIsValid ? <Text style={[styles.errorText, { color: colors.danger }]}>Use HH:MM.</Text> : null}
      </View>

      {registrationResult ? (
        <Text
          style={[
            styles.statusText,
            { color: registrationResult.success ? colors.tint : colors.mutedText },
          ]}>
          {registrationResult.message}
        </Text>
      ) : null}
      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      <Button
        title={isSaving ? 'Saving...' : 'Save reminders'}
        disabled={isSaving || !timeIsValid}
        onPress={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    marginTop: 4,
  },
  iconButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleGroup: {
    gap: 10,
  },
  toggleRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    minHeight: 42,
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
});
