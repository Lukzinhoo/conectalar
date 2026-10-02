export const colors = {
  primary: '#1E40AF',
  primaryDark: '#172554',
  primaryLight: '#DBEAFE',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#64748B',
  textLight: '#94A3B8',

  border: '#E2E8F0',

  success: '#16A34A',
  successLight: '#DCFCE7',

  warning: '#D97706',
  warningLight: '#FEF3C7',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
  },

  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
  },

  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },

  button: {
    fontSize: 15,
    fontWeight: '700' as const,
  },

  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
};