import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { getNotificationPreferences, updateNotificationPreferences } from '../api';
import {
  getNotificationPermissionState,
  refreshNotificationReminders,
  registerDeviceForPushNotifications,
  syncLocalReminderPreferences,
  unregisterDeviceForPushNotifications,
} from '../deviceNotifications';
import type {
  NotificationPermissionState,
  NotificationPreferences,
  PushRegistrationResult,
} from '../types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types';

const defaultPermissionState: NotificationPermissionState = {
  granted: false,
  status: 'unknown',
};

export function useNotificationPreferences() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>(defaultPermissionState);
  const [registrationResult, setRegistrationResult] = useState<PushRegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const refreshPermissionState = useCallback(async () => {
    const nextState = await getNotificationPermissionState();
    setPermissionState(nextState);
    return nextState;
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!token) {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      setPermissionState(defaultPermissionState);
      setError('Sign in to manage notification reminders.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [nextPreferences] = await Promise.all([
        getNotificationPreferences(token),
        refreshPermissionState(),
      ]);
      setPreferences(nextPreferences);
      await syncLocalReminderPreferences(nextPreferences);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load notification preferences.'));
    } finally {
      setIsLoading(false);
    }
  }, [refreshPermissionState, token]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const savePreferences = useCallback(
    async (nextPreferences: NotificationPreferences) => {
      if (!token) {
        return { success: false, error: 'Sign in to manage notification reminders.' };
      }

      setIsSaving(true);
      setError(null);

      try {
        const savedPreferences = await updateNotificationPreferences(token, nextPreferences);
        setPreferences(savedPreferences);
        await syncLocalReminderPreferences(savedPreferences);

        if (savedPreferences.expoPushNotifications) {
          const result = await registerDeviceForPushNotifications(token);
          setRegistrationResult(result);
        } else {
          await unregisterDeviceForPushNotifications(token);
          setRegistrationResult(null);
        }

        await refreshNotificationReminders(token);
        await refreshPermissionState();

        return { success: true };
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, 'Unable to save notification preferences.');
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSaving(false);
      }
    },
    [refreshPermissionState, token],
  );

  const enableDeviceNotifications = useCallback(async () => {
    if (!token) {
      return { success: false, error: 'Sign in to enable notifications.' };
    }

    setIsRegistering(true);
    setError(null);

    try {
      const result = await registerDeviceForPushNotifications(token);
      setRegistrationResult(result);
      await refreshPermissionState();
      await refreshNotificationReminders(token);

      if (!result.success && result.status !== 'unsupported') {
        setError(result.message);
      }

      return { success: result.success || result.status === 'unsupported', error: result.message };
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Unable to enable notifications.');
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsRegistering(false);
    }
  }, [refreshPermissionState, token]);

  return useMemo(
    () => ({
      enableDeviceNotifications,
      error,
      isLoading,
      isRegistering,
      isSaving,
      loadPreferences,
      permissionState,
      preferences,
      refreshPermissionState,
      registrationResult,
      savePreferences,
    }),
    [
      enableDeviceNotifications,
      error,
      isLoading,
      isRegistering,
      isSaving,
      loadPreferences,
      permissionState,
      preferences,
      refreshPermissionState,
      registrationResult,
      savePreferences,
    ],
  );
}
