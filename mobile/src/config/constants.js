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

// "MacroPulse" — Modern Fintech Dark Theme (Linear / Raycast / Bloomberg Terminal).
// Nền tối phân lớp sâu #080B11, bề mặt kính mờ phân tầng, viền trắng siêu mảnh 4%→12%,
// Accents: Xanh lá neon (Emerald-400) cho live; Đỏ cam san hô (Rose-500) cho tin nóng; Vàng hổ phách (Amber-400) cho Vàng XAU & vĩ mô.
// Typo: Tiêu đề text-slate-100 (#F1F5F9), phụ text-slate-400 (#94A3B8), thông số text-slate-300 (#CBD5E1), mờ text-slate-500 (#64748B).
export const COLORS = {
  background: '#080B11',
  surface: '#0D111A',
  surfaceAlt: '#121824',
  surfaceElevated: '#171F2F',
  surfaceGlass: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderSoft: 'rgba(255, 255, 255, 0.04)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(245, 166, 35, 0.40)',
  primary: '#F5A623',
  primaryDeep: '#D98E04',
  primarySoft: 'rgba(245, 166, 35, 0.12)',
  primaryText: '#080B11',
  important: '#F43F5E',
  importantDeep: '#E11D48',
  importantSoft: 'rgba(244, 63, 94, 0.12)',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gold: '#FBBF24',
  green: '#34D399',
  success: '#34D399',
  danger: '#F43F5E',
  amber: '#F5A623',
  up: '#34D399',
  down: '#F43F5E',
  cyan: '#38BDF8',
  violet: '#A78BFA',
};

export const GRADIENTS = {
  header: ['rgba(13, 17, 26, 0.95)', 'rgba(8, 11, 17, 0.98)'],
  brand: ['#F5A623', '#D98E04'],
  gold: ['#FBBF24', '#F5A623'],
  importantRibbon: ['#F43F5E', '#881337'],
  cardTop: ['rgba(255, 255, 255, 0.03)', 'rgba(8, 11, 17, 0)'],
  activeTab: ['rgba(245, 166, 35, 0.16)', 'rgba(245, 166, 35, 0.04)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#F5A623', bg: 'rgba(245, 166, 35, 0.10)', border: 'rgba(245, 166, 35, 0.20)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)', border: 'rgba(251, 191, 36, 0.20)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.10)', border: 'rgba(56, 189, 248, 0.20)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.10)', border: 'rgba(167, 139, 250, 0.20)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.10)', border: 'rgba(244, 63, 94, 0.20)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.16)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#34D399', bg: 'rgba(52, 211, 153, 0.10)', border: 'rgba(52, 211, 153, 0.20)' },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const APP_NAME = 'MacroPulse';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#94A3B8';
export const TAB_ACTIVE = '#F8FAFC';

// Font sans-serif chuyên nghiệp (Inter/Roboto/SF Pro trên web)
export const FONT_FAMILY = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  default: undefined,
});

// Font monospace cho financial terminal / metrics
export const FONT_MONO = Platform.select({
  web: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  default: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];