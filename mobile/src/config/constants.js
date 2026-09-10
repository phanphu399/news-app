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

// Minimalist Fintech Dark Terminal — palette kỷ luật, ít màu, đúng ngữ cảnh
export const COLORS = {
  background: '#0B0E14',
  surface: '#151921',
  surfaceAlt: '#1A1F2B',
  surfaceElevated: '#1A1F2B',
  border: 'rgba(255,255,255,0.07)',
  borderSoft: 'rgba(255,255,255,0.05)',
  primary: '#F59E0B',
  primaryDeep: '#D97706',
  primaryText: '#0B0E14',
  important: '#F43F5E',
  importantDeep: '#E11D48',
  importantSoft: 'rgba(244,63,94,0.10)',
  text: '#F5F7FA',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  gold: '#D4AF37',
  green: '#34D399',
  success: '#34D399',
  danger: '#EF4444',
  amber: '#F59E0B',
  up: '#34D399',
  down: '#F43F5E',
};

export const GRADIENTS = {
  header: ['#0B0E14', '#0D1117'],
  brand: ['#F59E0B', '#D97706'],
  gold: ['#F59E0B', '#D97706'],
  importantRibbon: ['#F43F5E', '#7F1D1D'],
  cardTop: ['rgba(245,158,11,0.08)', 'rgba(11,14,20,0)'],
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
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'NEWS';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#9CA3AF';
export const TAB_ACTIVE = '#F59E0B';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];