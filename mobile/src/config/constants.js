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

// MacroPulse — Bloomberg Terminal Dark Theme
// Nền siêu tối #05070A, surface phân tầng, accent Cyan Neon #00D4FF
// Dense, professional, data-heavy. Mobile-first.
export const COLORS = {
  background: '#05070A',
  surface: '#090C12',
  surfaceAlt: '#0D1018',
  surfaceElevated: '#111520',
  surfaceGlass: 'rgba(0, 212, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderSoft: 'rgba(255, 255, 255, 0.03)',
  borderHover: 'rgba(0, 212, 255, 0.20)',
  borderActive: 'rgba(0, 212, 255, 0.50)',
  // Cyan neon primary
  primary: '#00D4FF',
  primaryDeep: '#00A8CC',
  primarySoft: 'rgba(0, 212, 255, 0.10)',
  primaryText: '#05070A',
  // Alert / Important
  important: '#FF3B5C',
  importantDeep: '#E0003D',
  importantSoft: 'rgba(255, 59, 92, 0.12)',
  // Text hierarchy
  text: '#F0F4F8',
  textSecondary: '#8899AA',
  textMuted: '#4A5568',
  // Market colors
  gold: '#F5B731',
  green: '#00E676',
  success: '#00E676',
  danger: '#FF3B5C',
  amber: '#F5B731',
  up: '#00E676',
  down: '#FF3B5C',
  cyan: '#00D4FF',
  violet: '#B388FF',
  orange: '#FF9800',
};

export const GRADIENTS = {
  header: ['rgba(5, 7, 10, 0.98)', 'rgba(5, 7, 10, 0.95)'],
  brand: ['#00D4FF', '#00A8CC'],
  gold: ['#F5B731', '#D4940A'],
  importantRibbon: ['#FF3B5C', '#8B0026'],
  cardTop: ['rgba(0, 212, 255, 0.04)', 'rgba(5, 7, 10, 0)'],
  activeTab: ['rgba(0, 212, 255, 0.14)', 'rgba(0, 212, 255, 0.03)'],
};

export const IMPORTANT_BORDER_COLOR = COLORS.importantDeep;
export const IMPORTANT_DOT_COLOR = COLORS.important;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BACKGROUND = COLORS.surface;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textSecondary;
export const ACCENT_COLOR = COLORS.primary;

export const CATEGORY_STYLES = {
  Macro: {
    label: 'KINH TẾ VĨ MÔ', short: 'Vĩ mô',
    color: '#F5B731', bg: 'rgba(245, 183, 49, 0.08)', border: 'rgba(245, 183, 49, 0.25)',
  },
  XAUUSD: {
    label: 'VÀNG & DẦU', short: 'Vàng',
    color: '#FFD700', bg: 'rgba(255, 215, 0, 0.08)', border: 'rgba(255, 215, 0, 0.22)',
  },
  Forex: {
    label: 'NGOẠI TỆ', short: 'FX',
    color: '#00D4FF', bg: 'rgba(0, 212, 255, 0.08)', border: 'rgba(0, 212, 255, 0.22)',
  },
  Crypto: {
    label: 'TIỀN SỐ', short: 'Crypto',
    color: '#B388FF', bg: 'rgba(179, 136, 255, 0.08)', border: 'rgba(179, 136, 255, 0.22)',
  },
  Geopolitics: {
    label: 'ĐỊA CHÍNH TRỊ', short: 'Chiến sự',
    color: '#FF3B5C', bg: 'rgba(255, 59, 92, 0.08)', border: 'rgba(255, 59, 92, 0.22)',
  },
  Paywall: {
    label: 'BÀI TRẢ PHÍ', short: 'Trả phí',
    color: '#607080', bg: 'rgba(96, 112, 128, 0.06)', border: 'rgba(96, 112, 128, 0.15)',
  },
  Custom: {
    label: 'FEED CỦA BẠN', short: 'Bạn',
    color: '#00E676', bg: 'rgba(0, 230, 118, 0.08)', border: 'rgba(0, 230, 118, 0.22)',
  },
};

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Macro;
}

export const REFRESH_INTERVAL_MS = 5 * 1000;
export const APP_NAME = 'MacroPulse';
export const APP_TAGLINE = 'Tin thị trường · Forex · Macro';

export const TAB_INACTIVE = '#4A5568';
export const TAB_ACTIVE = '#F0F4F8';

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