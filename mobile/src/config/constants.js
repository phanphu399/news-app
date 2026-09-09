import Constants from 'expo-constants';

export const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://news-realtime-eight.vercel.app';

// Palette
export const COLORS = {
  background: '#0b0e14',
  surface: '#131a26',
  surfaceAlt: '#1a2231',
  border: '#223046',
  borderSoft: '#1a2438',
  primary: '#38bdf8',
  primaryText: '#082f49',
  important: '#f43f5e',
  importantDeep: '#e11d48',
  importantSoft: '#2a1220',
  text: '#e8eef7',
  textSecondary: '#8fa3bf',
  textMuted: '#5d708c',
  gold: '#f5c542',
  green: '#34d399',
  success: '#34d399',
  danger: '#fb7185',
  amber: '#fbbf24',
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  XAUUSD: { label: 'VÀNG & DẦU', color: '#f5c542', bg: 'rgba(245,197,66,0.12)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  Custom: { label: 'FEED CỦA BẠN', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 60000;
export const APP_NAME = 'ASTER';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';