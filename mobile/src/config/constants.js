import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://news-app-realtime-seven.vercel.app';

// Palette — dark mode chuyên nghiệp kiểu trading terminal
export const COLORS = {
  background: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#1c2128',
  surfaceElevated: '#1f2630',
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.05)',
  primary: '#F59E0B',
  primaryText: '#0d1117',
  important: '#f43f5e',
  importantDeep: '#e11d48',
  importantSoft: '#2a1220',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  gold: '#D4AF37',
  green: '#10b981',
  success: '#10b981',
  danger: '#ef4444',
  amber: '#F59E0B',
  up: '#10b981',
  down: '#ef4444',
};

export const GRADIENTS = {
  header: ['#131722', '#0d1117'],
  brand: ['#F59E0B', '#D4AF37'],
  gold: ['#F59E0B', '#B45309'],
  importantRibbon: ['#e11d48', '#9f1239'],
  cardTop: ['rgba(245,158,11,0.14)', 'rgba(13,17,23,0)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#D4AF37', bg: 'rgba(212,175,55,0.14)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'NEWS';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#8b949e';
export const TAB_ACTIVE = '#F59E0B';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];