/** Design tokens from @citewalk/design-tokens – single source of truth with web */
import {
  StyleSheet,
  Platform,
  type DimensionValue,
  type ColorValue,
} from "react-native";
import {
  COLORS as TOKEN_COLORS,
  SPACING as TOKEN_SPACING,
  SIZES as TOKEN_SIZES,
  LAYOUT as TOKEN_LAYOUT,
  HEADER as TOKEN_HEADER,
  MODAL as TOKEN_MODAL,
} from "@citewalk/design-tokens";

export const COLORS = TOKEN_COLORS;
export const SPACING = TOKEN_SPACING;
export const SIZES = TOKEN_SIZES;
export const LAYOUT = TOKEN_LAYOUT;
export const HEADER = TOKEN_HEADER;
export const MODAL = TOKEN_MODAL;

/** Cast token value for React Native ViewStyle/TextStyle (avoids string|number vs DimensionValue/ColorValue errors). */
export const toColor = (v: string | number): ColorValue =>
  (typeof v === "string" ? v : String(v)) as ColorValue;
export const toDimension = (v: string | number): number =>
  typeof v === "number" ? v : Number(v);
/** For style props that accept DimensionValue (e.g. width, height, padding). Preserves string values like '100%'. */
export const toDimensionValue = (v: string | number): DimensionValue =>
  v as DimensionValue;

/** Use when styles object uses theme tokens (MODAL/HEADER/SIZES) that TypeScript flags; keeps return type correct. */
export function createStyles<T extends Record<string, object>>(styles: T): T {
  return StyleSheet.create(styles as Record<string, object>) as T;
}

// Fonts: Inter for app shell (tabs, headers, buttons), IBM Plex Serif for content (feed, articles, intro)
export const FONTS = {
  // Inter - for app shell (tabs, headers, buttons, UI elements)
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  // IBM Plex Serif - for content (feed text, articles, intro)
  serifRegular: "IBMPlexSerif_400Regular",
  serifSemiBold: "IBMPlexSerif_600SemiBold",
  // Monospace (e.g. 2FA codes, inline code)
  mono: Platform.select({ ios: "Menlo", android: "monospace" }) ?? "monospace",
};

/** Fixed profile header aspect ratio (width : height). Same on profile and draw modal so drawing matches header. 1 (square) allows enough room for avatar + bio. */
export const PROFILE_HEADER_ASPECT_RATIO = 1;

/** Opacity for draw canvas overlay (0–1). Used by DrawBackgroundModal for SVG fillOpacity. */
export const DRAW_CANVAS_OPACITY = 0.45;

/** @deprecated Use screenWidth / PROFILE_HEADER_ASPECT_RATIO for height. Kept for any legacy fallback. */
export const PROFILE_TOP_HEIGHT = 380;

/** Tab bar height (bottom nav) – use for list paddingBottom on tab screens so last item isn't hidden. */
export const TAB_BAR_HEIGHT = 50;

/** Extra padding below list content (above safe area / tab bar). Use: insets.bottom + TAB_BAR_HEIGHT + LIST_PADDING_EXTRA (tab screens) or insets.bottom + LIST_PADDING_EXTRA (stack). */
export const LIST_PADDING_EXTRA = 24;

/** Default FlatList performance props – use across lists for consistent behavior. */
export const FLATLIST_DEFAULTS = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 10,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 50,
  onEndReachedThreshold: 0.5,
} as const;

/** Scroll behavior shared by all list screens (home, explore, profile, user, topic, collection). */
export const LIST_SCROLL_DEFAULTS = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
  onEndReachedThreshold: 0.5,
} as const;

/** Shared horizontal tab bar styles (underline active) – use for Explore, Profile, Topic, Collection tabs. */
export const TABS = {
  container: {
    borderBottomWidth: 1,
    borderColor: TOKEN_COLORS.divider,
    backgroundColor: TOKEN_COLORS.ink,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    paddingRight: TOKEN_SPACING.l,
  },
  tab: {
    paddingVertical: TOKEN_SPACING.m,
    paddingHorizontal: TOKEN_SPACING.s,
    borderBottomWidth: 3,
    borderBottomColor: "transparent" as const,
  },
  tabActive: {
    borderBottomColor: TOKEN_COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    color: TOKEN_COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: TOKEN_COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
} as const;

/** Shared search bar styles – use these or the SearchBar component for consistent look across the app. */
export const SEARCH_BAR = {
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: TOKEN_COLORS.hover,
    borderRadius: TOKEN_SIZES.borderRadius,
    paddingHorizontal: TOKEN_SPACING.m,
    paddingVertical: TOKEN_SPACING.s,
    gap: TOKEN_SPACING.s,
    minHeight: 48,
    borderWidth: 1,
    borderColor: TOKEN_COLORS.divider,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: TOKEN_COLORS.paper,
    paddingVertical: 4,
    fontFamily: FONTS.regular,
  },
} as const;

export default {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
  LAYOUT,
  HEADER,
  MODAL,
  FLATLIST_DEFAULTS,
  LIST_SCROLL_DEFAULTS,
  SEARCH_BAR,
  TABS,
  TAB_BAR_HEIGHT,
  LIST_PADDING_EXTRA,
};
