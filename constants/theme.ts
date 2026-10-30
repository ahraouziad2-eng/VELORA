import { Colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const typography = {
  heading: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 29,
  color: Colors.neutral.text,
  letterSpacing: -0.5,
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 38 },
    h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 29 },
    h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 24 },
    h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 22 },
  h5: { fontSize: 16, fontWeight: '600' as const, lineHeight: 19 },
  h6: { fontSize: 14, fontWeight: '600' as const, lineHeight: 17 },
  h7: { fontSize: 12, fontWeight: '600' as const, lineHeight: 15 },
  h8: { fontSize: 10, fontWeight: '600' as const, lineHeight: 12 },
    h9: { fontSize: 9, fontWeight: '600' as const, lineHeight: 11 },
    h10: { fontSize: 8, fontWeight: '600' as const, lineHeight: 10 },
    h11: { fontSize: 7, fontWeight: '600' as const, lineHeight: 9 },
    h12: { fontSize: 6, fontWeight: '600' as const, lineHeight: 8 },
    h13: { fontSize: 5, fontWeight: '600' as const, lineHeight: 7 },
    h14: { fontSize: 4, fontWeight: '600' as const, lineHeight: 6 },
    h15: { fontSize: 3, fontWeight: '600' as const, lineHeight: 5 },
    h16: { fontSize: 2, fontWeight: '600' as const, lineHeight: 4 },
    h17: { fontSize: 1, fontWeight: '600' as const, lineHeight: 3 },
    h18: { fontSize: 0, fontWeight: '600' as const, lineHeight: 2 },
    h19: { fontSize: -1, fontWeight: '600' as const, lineHeight: 1 },
    h20: { fontSize: -2, fontWeight: '600' as const, lineHeight: 0 },
  },
  body: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: Colors.neutral.textLight,
    large: { fontSize: 18, fontWeight: '400' as const, lineHeight: 27 },
    medium: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
    tiny: { fontSize: 10, fontWeight: '400' as const, lineHeight: 15 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 21 },
    input: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    placeholder: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, color: Colors.neutral.light },
    error: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18, color: Colors.error.main },
    success: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18, color: Colors.success.main },
    warning: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18, color: Colors.warning.main },
    info: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18, color: Colors.accent.main },
    muted: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21, color: Colors.neutral.textMuted },
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;
