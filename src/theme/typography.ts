import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({
    web: 'Arial, sans-serif',
    default: 'System',
  }),

  medium: Platform.select({
    web: 'Arial, sans-serif',
    default: 'System',
  }),

  semibold: Platform.select({
    web: 'Arial, sans-serif',
    default: 'System',
  }),

  bold: Platform.select({
    web: 'Arial, sans-serif',
    default: 'System',
  }),
};

export const typography = {
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    fontWeight: '800' as const,
    lineHeight: 30,
  },

  pageSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
  },

  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 21,
  },

  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },

  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 18,
  },

  button: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },

  menu: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 19,
  },

  caption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 16,
  },

  statNumber: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28,
  },
};