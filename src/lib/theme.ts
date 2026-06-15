import { StyleSheet } from 'react-native';

// ─── Color System ──────────────────────────────────────────────
// Government-branded warm palette – professional, accessible, trustworthy
export const RHSColors = {
  // ── Primary (Government Blue) ──
  blue50: '#E3F2FD',
  blue100: '#BBDEFB',
  blue200: '#90CAF9',
  blue400: '#42A5F5',
  blue600: '#1E88E5',
  blue700: '#1565C0',
  blue800: '#0D47A1',
  blue900: '#0A3A85',

  // ── Accent (National Red) ──
  red50: '#FFEBEE',
  red400: '#EF5350',
  red600: '#D32F2F',
  red700: '#B71C1C',

  // ── Success ──
  green50: '#E8F5E9',
  green600: '#2E7D32',
  green700: '#1B5E20',

  // ── Warning ──
  amber50: '#FFF8E1',
  amber600: '#F9A825',
  amber700: '#F57F17',

  // ── Neutrals ──
  white: '#FFFFFF',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',
  black: '#000000',

  // ── Semantic Aliases ──
  surface: '#F4F6F8',           // Soft grey-blue background
  surfaceCard: '#FFFFFF',       // Card surface
  text: '#1A1A2E',              // Primary text
  textSecondary: '#546E7A',     // Secondary text
  textMuted: '#90A4AE',         // Muted/disabled text
  border: '#E0E6ED',            // Subtle border
  borderFocus: '#42A5F5',       // Focused border
  shadow: 'rgba(0,0,0,0.08)',  // Standard shadow

  // ── Legacy (backward compat) ──
  govRed: '#D32F2F',
  govGold: '#F9A825',
  govGoldDark: '#F57F17',
  govBlue: '#1E88E5',
  govBlueDark: '#0D47A1',
  govTeal: '#00ACC1',
  govGreen: '#2E7D32',
  error: '#D32F2F',
  success: '#2E7D32',
};

// ─── Spacing Scale (8pt grid) ───────────────────────────────────
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// ─── Border Radius ──────────────────────────────────────────────
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ─── Typography ─────────────────────────────────────────────────
export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.3 },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const },
};

// ─── Shadow Presets ─────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  floating: {
    shadowColor: RHSColors.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

// ─── Common Component Styles ────────────────────────────────────
export const commonStyles = StyleSheet.create({
  // Cards
  card: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  cardFlat: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.md,
  },
  buttonDestructive: {
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.md,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Input
  input: {
    backgroundColor: RHSColors.white,
    borderWidth: 1.5,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: RHSColors.text,
  },

  // Section
  sectionTitle: {
    ...typography.h3,
    color: RHSColors.text,
    marginBottom: spacing.md,
  },
});