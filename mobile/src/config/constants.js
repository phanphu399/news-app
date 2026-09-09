import Constants from 'expo-constants';

export const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const IMPORTANT_BORDER_COLOR = '#e11d48';
export const IMPORTANT_DOT_COLOR = '#f43f5e';
export const BACKGROUND_COLOR = '#0b0e14';
export const CARD_BACKGROUND = '#141922';
export const TEXT_PRIMARY = '#f1f5f9';
export const TEXT_SECONDARY = '#94a3b8';
export const ACCENT_COLOR = '#38bdf8';

export const CATEGORY_LABELS = {
  Macro: 'Macro',
  XAUUSD: 'XAUUSD',
  Paywall: 'Paywall',
  Geopolitics: 'Geopolitics',
  Custom: 'Custom',
};

export const REFRESH_INTERVAL_MS = 60000;