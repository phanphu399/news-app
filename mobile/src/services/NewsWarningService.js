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

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1400;
    lowpass.Q.value = 0.4;
    lowpass.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(lowpass);

    const notes = [
      { freq: 659.25, at: 0.0, dur: 0.9 }, // E5
      { freq: 987.77, at: 0.17, dur: 0.9 }, // B5 — quãng năm, dễ chịu
      { freq: 1318.5, at: 0.35, dur: 0.6 }, // E6 — lấp lánh nhẹ
    ];
    const vols = [0.13, 0.095, 0.045];
    for (const [index, note] of notes.entries()) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = note.freq;
      const start = ctx.currentTime + note.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vols[index], start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + note.dur + 0.05);
    }
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
        sound: 'chime-soft.wav',
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
          sound: 'chime-soft.wav',
          data: { url: newsItem.url },
        },
        trigger: null,
      });
    } catch {
      /* fallback: skip local notification */
    }
  },
};