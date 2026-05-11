/**
 * Bunch peak alerts. Schedules a notification for the *next* banana in
 * the bunch to hit peak. When that banana ripens / changes environment
 * / gets eaten, the alert is rescheduled.
 *
 * One notification at a time. We'd swamp users if every banana fired its
 * own peak alert.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Bunch, secondsUntilPeak, nextBananaToPeak } from './pet';

const PEAK_ALERT_TAG = 'gobananas-bunch-peak';

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    if (existing.status === 'denied' && !existing.canAskAgain) return false;
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelPeakAlert(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.tag === PEAK_ALERT_TAG)
        .map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier),
        ),
    );
  } catch {
    // Silent.
  }
}

export async function scheduleBunchPeakAlert(bunch: Bunch): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelPeakAlert();
  const next = nextBananaToPeak(bunch);
  if (!next) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const seconds = secondsUntilPeak(next.ripeness, next.environment);
  if (seconds <= 0) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🍌 ${next.name} is at peak`,
        body: `From ${bunch.name}. Eat now or it's all downhill.`,
        data: { tag: PEAK_ALERT_TAG, bananaId: next.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  } catch {
    // Silent.
  }
}
