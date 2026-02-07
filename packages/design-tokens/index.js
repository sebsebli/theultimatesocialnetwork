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
  /** External URL links – muted sage green */
  link: '#9BB8A8',
  /** @mention (profile/person) – soft blue */
  mention: '#8BB4D9',
  /** @mention dot/avatar background */
  mentionDot: '#5A8AB5',
  /** [[Topic]] tags – warm gold */
  topic: '#C4A265',
  /** [[post:id]] in-body links – warm peach */
  postLink: '#D4956A',
  /** Inline count numbers (posts, cites) */
  inlineCount: 'rgba(255,255,255,0.45)',
  /** Success indicators, toggles */
  success: '#22C55E',
  /** Badge / chip background – primary at 20% opacity */
  badge: 'rgba(110, 122, 138, 0.2)',
  /** Heavy overlay for reading modes, bottom sheets */
  overlayHeavy: 'rgba(0, 0, 0, 0.75)',
  /** Code block background */
  codeBackground: '#1E1E1E',
  /** Code block text */
  codeText: '#D4D4D4',
  /** Graph node: topic */
  graphTopic: '#5EC4A0',
  /** Graph node: user/author */
  graphUser: '#5BA8E8',
  /** Graph node: external source */
  graphSource: '#E8A85B',
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
  /** Semi-transparent circle behind header icons (back, more) for consistent look across all screens */
  iconCircleSize: 40,
  iconCircleBackground: 'rgba(0,0,0,0.35)',
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
      link: COLORS.link,
      mention: COLORS.mention,
      mentionDot: COLORS.mentionDot,
      topic: COLORS.topic,
      postLink: COLORS.postLink,
      inlineCount: COLORS.inlineCount,
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
  --link: ${COLORS.link};
  --mention: ${COLORS.mention};
  --mention-dot: ${COLORS.mentionDot};
  --topic: ${COLORS.topic};
  --post-link: ${COLORS.postLink};
  --inline-count: ${COLORS.inlineCount};
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
