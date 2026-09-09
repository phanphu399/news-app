import { Platform } from 'react-native';

let Notifications = null;

async function getNotifications() {
  if (Notifications) return Notifications;
  if (Platform.OS === 'web') return null;
  try {
    const mod = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    Notifications = mod;
    return mod;
  } catch {
    return null;
  }
}

async function playWebBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio not available */
  }
}

export const NewsWarningService = {
  async playBeep() {
    if (Platform.OS === 'web') {
      await playWebBeep();
      return;
    }
    try {
      const Notif = await getNotifications();
      if (!Notif) return;
      Notif.setNotificationChannelAsync('market_alerts', {
        name: 'Market Alerts',
        importance: Notif.AndroidImportance.MAX,
        sound: 'beep.wav',
        vibrationPattern: [0, 250, 100, 250],
      });
    } catch {
      /* sound config failure is non-fatal */
    }
  },

  async scheduleLocal(newsItem) {
    if (!newsItem?.title || Platform.OS === 'web') return;
    try {
      const Notif = await getNotifications();
      if (!Notif) return;
      const current = await Notif.getPermissionsAsync();
      const granted = current.granted
        ? true
        : (await Notif.requestPermissionsAsync()).granted;
      if (!granted) return;

      await Notif.scheduleNotificationAsync({
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