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

// "Aster Blue Black" — Modern Minimalist Fintech (Linear/TradingView/Raycast) 2026.
// Nền xanh-đen sâu, bề mặt phân tầng theo mức, viền trắng 7%→14%, accent duy nhất
// Amber-500 #F59E0B chỉ cho CTA/trạng thái active. Typo off-white #E7E9EE.
export const COLORS = {
  background: '#0A0D14',
  surface: '#121721',
  surfaceAlt: '#181F2E',
  surfaceElevated: '#1E2636',
  border: 'rgba(255,255,255,0.07)',
  borderSoft: 'rgba(255,255,255,0.05)',
  borderHover: 'rgba(255,255,255,0.14)',
  primary: '#F59E0B',
  primaryDeep: '#D97706',
  primarySoft: 'rgba(245,158,11,0.12)',
  primaryText: '#1A1205',
  important: '#F2555A',
  importantDeep: '#D13C43',
  importantSoft: 'rgba(242,85,90,0.12)',
  text: '#E7E9EE',
  textSecondary: '#9AA4B2',
  textMuted: '#707B8A',
  gold: '#F2C14E',
  green: '#3DD68C',
  success: '#3DD68C',
  danger: '#F2555A',
  amber: '#F59E0B',
  up: '#3DD68C',
  down: '#F2555A',
  cyan: '#58A6DC',
  violet: '#A78BFA',
};

export const GRADIENTS = {
  header: ['#121721', '#0A0D14'],
  brand: ['#F59E0B', '#D97706'],
  gold: ['#F59E0B', '#DFA13A'],
  importantRibbon: ['#F2555A', '#4A1D26'],
  cardTop: ['rgba(245,158,11,0.06)', 'rgba(10,13,20,0)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#F2C14E', bg: 'rgba(242,193,78,0.10)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#58A6DC', bg: 'rgba(88,166,220,0.12)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#F2555A', bg: 'rgba(242,85,90,0.10)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#9AA4B2', bg: 'rgba(154,164,178,0.08)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#3DD68C', bg: 'rgba(61,214,140,0.10)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'NEWS';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#8B95A3';
export const TAB_ACTIVE = '#F59E0B';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];