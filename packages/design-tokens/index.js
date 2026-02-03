/**
 * Single source of truth for Citewalk design tokens.
 * Used by apps/web (Tailwind + CSS) and apps/mobile (theme re-export).
 * Keep in sync: change here only, then align mobile theme.ts to import or mirror.
 */

const COLORS = {
  ink: '#0B0B0C',
  paper: '#F2F2F2',
  primary: '#6E7A8A',
  primaryDark: '#5A6573',
  secondary: '#A8A8AA',
  tertiary: '#6E6E73',
  divider: '#1A1A1D',
  hover: 'rgba(255, 255, 255, 0.05)',
  pressed: 'rgba(255, 255, 255, 0.1)',
  error: '#B85C5C',
  like: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.5)',
  /** External URL links – warm orange, no underline */
  link: '#D97A3C',
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  header: 50,
};

const SIZES = {
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  avatarSmall: 32,
  avatarMedium: 40,
  avatarLarge: 80,
  borderRadius: 8,
  borderRadiusPill: 16,
};

const LAYOUT = {
  contentPaddingHorizontal: SPACING.l,
  contentPaddingVertical: SPACING.m,
  scrollPaddingBottom: SPACING.xxl,
};

const HEADER = {
  iconSize: 24,
  titleSize: 17,
  barPaddingHorizontal: LAYOUT.contentPaddingHorizontal,
  barPaddingBottom: SPACING.m,
  iconColor: COLORS.paper,
  saveColor: COLORS.primary,
  cancelColor: COLORS.paper,
};

const MODAL = {
  backdropBackgroundColor: COLORS.overlay,
  sheetBackgroundColor: COLORS.ink,
  sheetBorderRadius: SIZES.borderRadius,
  sheetBorderColor: COLORS.divider,
  sheetPaddingHorizontal: SPACING.l,
  sheetPaddingTop: SPACING.s,
  sheetTitleFontSize: 18,
  sheetTitleColor: COLORS.paper,
  buttonMinHeight: 44,
  buttonPaddingVertical: SPACING.m,
  buttonPaddingHorizontal: SPACING.l,
  buttonBorderRadius: SIZES.borderRadius,
  buttonFontSize: 16,
  primaryButtonBackgroundColor: COLORS.primary,
  primaryButtonTextColor: COLORS.ink,
  secondaryButtonBackgroundColor: COLORS.hover,
  secondaryButtonBorderWidth: 1,
  secondaryButtonBorderColor: COLORS.divider,
  secondaryButtonTextColor: COLORS.paper,
  destructiveButtonBackgroundColor: COLORS.error,
  destructiveButtonTextColor: COLORS.paper,
};

/** For Tailwind theme.extend */
function toTailwind() {
  return {
    colors: {
      background: COLORS.ink,
      foreground: COLORS.paper,
      accent: COLORS.primary,
      secondary: COLORS.secondary,
      tertiary: COLORS.tertiary,
      divider: COLORS.divider,
      ink: COLORS.ink,
      paper: COLORS.paper,
      primary: COLORS.primary,
      primaryDark: COLORS.primaryDark,
      error: COLORS.error,
      like: COLORS.like,
    },
    spacing: {
      container: '680px',
      xs: `${SPACING.xs}px`,
      s: `${SPACING.s}px`,
      m: `${SPACING.m}px`,
      l: `${SPACING.l}px`,
      xl: `${SPACING.xl}px`,
      xxl: `${SPACING.xxl}px`,
      xxxl: `${SPACING.xxxl}px`,
    },
    borderRadius: {
      xl: `${SIZES.borderRadius}px`,
      pill: `${SIZES.borderRadiusPill}px`,
    },
    maxWidth: {
      '4xl': '896px',
      '5xl': '1024px',
    },
  };
}

/** CSS custom properties for :root */
function toCssVars() {
  return `
  --background: ${COLORS.ink};
  --foreground: ${COLORS.paper};
  --ink: ${COLORS.ink};
  --paper: ${COLORS.paper};
  --primary: ${COLORS.primary};
  --primary-dark: ${COLORS.primaryDark};
  --secondary: ${COLORS.secondary};
  --tertiary: ${COLORS.tertiary};
  --divider: ${COLORS.divider};
  --error: ${COLORS.error};
  --like: ${COLORS.like};
  --hover: ${COLORS.hover};
  --pressed: ${COLORS.pressed};
`.trim();
}

module.exports = {
  COLORS,
  SPACING,
  SIZES,
  LAYOUT,
  HEADER,
  MODAL,
  toTailwind,
  toCssVars,
};
