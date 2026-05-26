import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/store/authStore';
import {
  clearLocalNotificationReminders,
  configureNotificationHandling,
  refreshNotificationReminders,
} from '../deviceNotifications';

export function NotificationLifecycle() {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      void clearLocalNotificationReminders();
      return;
    }

    void refreshNotificationReminders(token);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshNotificationReminders(token);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    void configureNotificationHandling();
  }, []);

  return null;
}
