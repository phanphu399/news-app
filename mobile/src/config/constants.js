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

// "Nocturne Amber" — nền than chì ấm, bề mặt nổi phân tầng, accent cam duy nhất.
// Bảng màu HARMONIC: tương phản vừa phải, desaturation cho xanh/đỏ, điểm nhấn chỉ
// dùng cho thao tác chính — đúng chuẩn fintech 2026.
export const COLORS = {
  background: '#10151C',
  surface: '#171C24',
  surfaceAlt: '#1E242E',
  surfaceElevated: '#252C38',
  border: 'rgba(255,255,255,0.07)',
  borderSoft: 'rgba(255,255,255,0.05)',
  primary: '#F0A85C',
  primaryDeep: '#C98A3F',
  primarySoft: 'rgba(240,168,92,0.10)',
  primaryText: '#1A1205',
  important: '#E06B74',
  importantDeep: '#B94E58',
  importantSoft: 'rgba(224,107,116,0.12)',
  text: '#ECEFF4',
  textSecondary: '#9AA4B2',
  textMuted: '#707B8A',
  gold: '#E8B45B',
  green: '#6DBFA8',
  success: '#6DBFA8',
  danger: '#E06B74',
  amber: '#F0A85C',
  up: '#6DBFA8',
  down: '#E06B74',
  cyan: '#5FB2C9',
  violet: '#A78BFA',
};

export const GRADIENTS = {
  header: ['#121820', '#0E1218'],
  brand: ['#F0A85C', '#C98A3F'],
  gold: ['#F0A85C', '#D9994A'],
  importantRibbon: ['#E06B74', '#5C2C31'],
  cardTop: ['rgba(240,168,92,0.07)', 'rgba(16,21,28,0)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#F0A85C', bg: 'rgba(240,168,92,0.10)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#E8B45B', bg: 'rgba(232,180,91,0.10)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#5FB2C9', bg: 'rgba(95,178,201,0.12)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#E06B74', bg: 'rgba(224,107,116,0.10)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#8B95A3', bg: 'rgba(139,149,163,0.08)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#6DBFA8', bg: 'rgba(109,191,168,0.10)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'NEWS';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#8B95A3';
export const TAB_ACTIVE = '#F0A85C';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];