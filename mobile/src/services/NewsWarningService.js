import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensurePermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export const NewsWarningService = {
  async playBeep() {
    try {
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('market_alerts', {
          name: 'Market Alerts',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'beep.wav',
          vibrationPattern: [0, 250, 100, 250],
        });
      }
    } catch {
      /* sound config failure is non-fatal */
    }
  },

  async scheduleLocal(newsItem) {
    if (!newsItem?.title) return;
    try {
      const granted = await ensurePermissions();
      if (!granted) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `\u26A0 ${newsItem.title}`,
          body: newsItem.source ? `Source: ${newsItem.source}` : 'Market alert',
          sound: 'beep.wav',
          data: { url: newsItem.url },
        },
        trigger: null,
      });
    } catch {
      /* fallback: skip local notification */
    }
  },
};