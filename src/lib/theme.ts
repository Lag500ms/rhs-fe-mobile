import { Platform, type TextStyle, type ViewStyle } from 'react-native';

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
  borderFocus: '#1565C0',       // Focused border
  shadow: 'rgba(15, 23, 42, 0.06)',  // Cool grey shadow

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

/** Web không có native animated module — luôn dùng JS driver. */
export const nativeDriver = Platform.OS !== 'web';

function parseCssColor(color: string): { r: number; g: number; b: number; a: number } {
  const c = color.trim();
  const rgba = c.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgba) {
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: rgba[4] != null ? +rgba[4] : 1 };
  }
  let hex = c.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
  let a = 1;
  if (hex.length === 8) {
    a = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  }
  const n = parseInt(hex, 16);
  if (Number.isNaN(n) || hex.length !== 6) return { r: 0, g: 0, b: 0, a: 1 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
}

function cssShadowColor(color: string, opacity: number): string {
  const { r, g, b, a } = parseCssColor(color);
  return `rgba(${r}, ${g}, ${b}, ${a * opacity})`;
}

type ShadowOpts = {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
};

/** iOS/Android giữ shadow*; web dùng boxShadow (RN-web 0.21 đã deprecate shadow*). */
export function shadowStyle(opts: ShadowOpts = {}): ViewStyle {
  const color = opts.color ?? RHSColors.shadow;
  const offset = opts.offset ?? { width: 0, height: 2 };
  const opacity = opts.opacity ?? 1;
  const radius = opts.radius ?? 6;
  const elevation = opts.elevation ?? 4;
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${cssShadowColor(color, opacity)}`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export function textShadowStyle(
  color: string,
  offset: { width: number; height: number } = { width: 0, height: 1 },
  radius = 3,
): TextStyle {
  if (Platform.OS === 'web') {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
    } as TextStyle;
  }
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius,
  };
}

// ─── Shadow Presets ─────────────────────────────────────────────
export const shadows = {
  sm: shadowStyle({
    color: RHSColors.shadow,
    offset: { width: 0, height: 1 },
    opacity: 1,
    radius: 3,
    elevation: 2,
  }),
  md: shadowStyle({
    color: RHSColors.shadow,
    offset: { width: 0, height: 2 },
    opacity: 1,
    radius: 6,
    elevation: 4,
  }),
  lg: shadowStyle({
    color: RHSColors.shadow,
    offset: { width: 0, height: 4 },
    opacity: 1,
    radius: 12,
    elevation: 8,
  }),
  card: shadowStyle({
    color: RHSColors.black,
    offset: { width: 0, height: 3 },
    opacity: 0.08,
    radius: 10,
    elevation: 3,
  }),
  floating: shadowStyle({
    color: RHSColors.blue700,
    offset: { width: 0, height: 6 },
    opacity: 0.25,
    radius: 16,
    elevation: 10,
  }),
};
