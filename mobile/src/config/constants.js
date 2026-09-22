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
// Nền tối phân lớp sâu #0B0E14, bề mặt kính mờ phân tầng, viền trắng mỏng tinh tế 5%→18%,
// Accents: Xanh lá neon (Emerald-400) cho live; Đỏ cam san hô (Rose-500) cho tin nóng; Vàng hổ phách (Amber-400) cho Vàng XAU & vĩ mô.
// Typo: Trắng sáng #F8FAFC (Slate-50), phụ #94A3B8 (Slate-400), mờ #64748B (Slate-500).
export const COLORS = {
  background: '#0B0E14',
  surface: '#111622',
  surfaceAlt: '#161D2B',
  surfaceElevated: '#1C2438',
  surfaceGlass: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSoft: 'rgba(255, 255, 255, 0.05)',
  borderHover: 'rgba(255, 255, 255, 0.18)',
  borderActive: 'rgba(245, 166, 35, 0.35)',
  primary: '#F5A623',
  primaryDeep: '#D98E04',
  primarySoft: 'rgba(245, 166, 35, 0.12)',
  primaryText: '#0B0E14',
  important: '#F43F5E',
  importantDeep: '#E11D48',
  importantSoft: 'rgba(244, 63, 94, 0.12)',
  text: '#F8FAFC',
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
  header: ['rgba(17, 22, 34, 0.95)', 'rgba(11, 14, 20, 0.98)'],
  brand: ['#F5A623', '#D98E04'],
  gold: ['#FBBF24', '#F5A623'],
  importantRibbon: ['#F43F5E', '#881337'],
  cardTop: ['rgba(255, 255, 255, 0.04)', 'rgba(11, 14, 20, 0)'],
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
  Macro: { label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô', color: '#F5A623', bg: 'rgba(245, 166, 35, 0.10)' },
  XAUUSD: { label: 'VÀNG & DẦU', short: 'Vàng', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)' },
  Forex: { label: 'NGOẠI TỆ', short: 'FX', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' },
  Crypto: { label: 'TIỀN SỐ', short: 'Crypto', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.10)' },
  Geopolitics: { label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)' },
  Paywall: { label: 'BÀI TRẢ PHÍ', short: 'Trả phí', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.08)' },
  Custom: { label: 'FEED CỦA BẠN', short: 'Bạn', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' },
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
  web: "'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  default: undefined,
});

// Dùng cho mọi con số (giá, thời gian, số đếm) để giữ thẳng hàng
export const TABULAR_NUMS = ['tabular-nums'];