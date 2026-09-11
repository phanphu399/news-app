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

// "MacroPulse" — Midnight Blue/Charcoal Fintech (Linear/TradingView 2026).
// Nền xanh than siêu tối #0B1426, bề mặt phân tầng slate, viền slate 8%→16%,
// accent duy nhất Vàng trầm #F5A623 (Gold/Amber) chỉ cho CTA/trạng thái active.
// Typo: trắng slate #F1F5F9; phụ đề Gray-400 #9CA3AF, mờ Gray-500 #64748B.
export const COLORS = {
  background: '#0B1426',
  surface: '#121826',
  surfaceAlt: '#182033',
  surfaceElevated: '#202B44',
  border: 'rgba(148,163,184,0.16)',
  borderSoft: 'rgba(148,163,184,0.08)',
  borderHover: 'rgba(148,163,184,0.30)',
  primary: '#F5A623',
  primaryDeep: '#D98E04',
  primarySoft: 'rgba(245,166,35,0.12)',
  primaryText: '#1A1405',
  important: '#FB7185',
  importantDeep: '#E11D48',
  importantSoft: 'rgba(251,113,133,0.12)',
  text: '#F1F5F9',
  textSecondary: '#9CA3AF',
  textMuted: '#64748B',
  gold: '#F5C144',
  green: '#34D399',
  success: '#34D399',
  danger: '#FB7185',
  amber: '#F5A623',
  up: '#34D399',
  down: '#FB7185',
  cyan: '#38BDF8',
  violet: '#A78BFA',
};

export const GRADIENTS = {
  header: ['#121826', '#0B1426'],
  brand: ['#F5A623', '#D98E04'],
  gold: ['#F5A623', '#DFA13A'],
  importantRibbon: ['#FB7185', '#4A1D26'],
  cardTop: ['rgba(245,166,35,0.06)', 'rgba(11,20,38,0)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#F5A623', bg: 'rgba(245,166,35,0.10)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#F5C144', bg: 'rgba(245,193,68,0.10)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#FB7185', bg: 'rgba(251,113,133,0.10)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#9CA3AF', bg: 'rgba(154,164,178,0.08)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#34D399', bg: 'rgba(52,211,153,0.10)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'MacroPulse';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#94A3B8';
export const TAB_ACTIVE = '#F5A623';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];