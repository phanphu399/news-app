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

// Graphite Amber — tông tối dịu mắt, giảm tương phản gắt, một accent duy nhất
export const COLORS = {
  background: '#0F1216',
  surface: '#171B21',
  surfaceAlt: '#1D222B',
  surfaceElevated: '#20262F',
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.055)',
  primary: '#F0A85C',
  primaryDeep: '#D98E4A',
  primaryText: '#14100A',
  important: '#E5636E',
  importantDeep: '#C94B56',
  importantSoft: 'rgba(229,99,110,0.12)',
  text: '#E7ECF3',
  textSecondary: '#A7B3C3',
  textMuted: '#788592',
  gold: '#E0B96A',
  green: '#6FC9A0',
  success: '#6FC9A0',
  danger: '#E5636E',
  amber: '#F0A85C',
  up: '#6FC9A0',
  down: '#E5636E',
};

export const GRADIENTS = {
  header: ['#101419', '#0D1015'],
  brand: ['#F0A85C', '#D98E4A'],
  gold: ['#F0A85C', '#D98E4A'],
  importantRibbon: ['#E5636E', '#6E2C33'],
  cardTop: ['rgba(240,168,92,0.08)', 'rgba(15,18,22,0)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#6FC9A0', bg: 'rgba(111,201,160,0.08)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'NEWS';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#8A94A3';
export const TAB_ACTIVE = '#F0A85C';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];