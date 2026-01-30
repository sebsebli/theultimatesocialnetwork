export const COLORS = {
  // Core Palette - Matches stitch_welcome_to_cite (web app)
  ink: '#0B0B0C', // Dark Background - matches web app
  paper: '#F2F2F2', // Text

  // Accents
  primary: '#6E7A8A', // Steel - matches web app
  primaryDark: '#5A6573',

  // Neutrals
  secondary: '#A8A8AA',
  tertiary: '#6E6E73',
  divider: '#1A1A1D', // Matches web app border-divider
  hover: 'rgba(255, 255, 255, 0.05)',
  pressed: 'rgba(255, 255, 255, 0.1)',

  // Status
  error: '#EF4444',
  like: '#EF4444',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  header: 50, // Top padding for headers
};

// Fonts: Inter for app shell (tabs, headers, buttons), IBM Plex Serif for content (feed, articles, intro)
export const FONTS = {
  // Inter - for app shell (tabs, headers, buttons, UI elements)
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  // IBM Plex Serif - for content (feed text, articles, intro)
  serifRegular: 'IBMPlexSerif_400Regular',
  serifSemiBold: 'IBMPlexSerif_600SemiBold',
};

export const SIZES = {
  iconSmall: 16,
  iconMedium: 20, // Action icons
  iconLarge: 24,
  avatarSmall: 32,
  avatarMedium: 40,
  avatarLarge: 80,
  borderRadius: 12,
  borderRadiusPill: 20,
};

/**
 * Single source of truth for screen layout. Use for all main content so screens align.
 * One main view with this padding; headers and content share the same horizontal inset.
 */
export const LAYOUT = {
  /** Horizontal padding for the main content area (lists, cards, headers). Use everywhere for a coherent edge. */
  contentPaddingHorizontal: SPACING.l,
  /** Vertical padding for scroll content (top of first item / bottom of list). */
  contentPaddingVertical: SPACING.m,
  /** Extra bottom padding for scroll areas (above tab bar or safe area). */
  scrollPaddingBottom: SPACING.xxl,
} as const;

/** Use these for all screen headers so headers look consistent app-wide. */
export const HEADER = {
  iconSize: 24,
  titleSize: 17,
  /** Horizontal padding for header bar (left/right). Matches LAYOUT so headers align with content. */
  barPaddingHorizontal: LAYOUT.contentPaddingHorizontal,
  /** Bottom padding for header bar. */
  barPaddingBottom: SPACING.m,
  /** Icon color for all header bar icons (back, more, search, settings). Use paper (light) on ink background. */
  iconColor: COLORS.paper,
  /** Save button text in header: same everywhere (e.g. Settings screens). */
  saveColor: COLORS.primary,
  /** Cancel/dismiss text in header (e.g. Compose close): same prominence as other header text. */
  cancelColor: COLORS.paper,
} as const;

/** Height of profile top section (avatar + name + stats). Draw canvas uses same height so saved image matches. */
export const PROFILE_TOP_HEIGHT = 380;

/** Shared styles for all card/sheet modals so they look and behave the same. */
export const MODAL = {
  /** Backdrop behind modal (dimmed overlay). */
  backdropBackgroundColor: COLORS.overlay,
  /** Bottom sheet / card container. */
  sheetBackgroundColor: COLORS.ink,
  sheetBorderRadius: SIZES.borderRadius,
  sheetBorderWidth: 1,
  sheetBorderBottomWidth: 0,
  sheetBorderColor: COLORS.divider,
  sheetPaddingHorizontal: SPACING.l,
  sheetPaddingTop: SPACING.s,
  /** Handle bar at top of sheet. */
  handleWidth: 36,
  handleHeight: 4,
  handleBorderRadius: 2,
  handleBackgroundColor: COLORS.tertiary,
  handleMarginTop: SPACING.m,
  handleMarginBottom: SPACING.l,
  /** Sheet title (e.g. "Report", "Share"). */
  sheetTitleFontSize: 18,
  sheetTitleFontWeight: '600' as const,
  sheetTitleColor: COLORS.paper,
  /** Action buttons: same min height, padding, radius, font. */
  buttonMinHeight: 44,
  buttonPaddingVertical: SPACING.m,
  buttonPaddingHorizontal: SPACING.l,
  buttonBorderRadius: SIZES.borderRadius,
  buttonFontSize: 16,
  buttonFontWeight: '600' as const,
  /** Primary (e.g. Submit, Save). */
  primaryButtonBackgroundColor: COLORS.primary,
  primaryButtonTextColor: COLORS.ink,
  /** Secondary / Cancel. */
  secondaryButtonBackgroundColor: COLORS.hover,
  secondaryButtonBorderWidth: 1,
  secondaryButtonBorderColor: COLORS.divider,
  secondaryButtonTextColor: COLORS.paper,
  /** Destructive (e.g. Report, Remove). */
  destructiveButtonBackgroundColor: COLORS.error,
  destructiveButtonTextColor: COLORS.paper,
} as const;

export default {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
  LAYOUT,
  HEADER,
  MODAL,
};