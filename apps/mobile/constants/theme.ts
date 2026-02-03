/** Design tokens from @citewalk/design-tokens – single source of truth with web */
import { StyleSheet, Platform, type DimensionValue, type ColorValue } from 'react-native';
import {
  COLORS as TOKEN_COLORS,
  SPACING as TOKEN_SPACING,
  SIZES as TOKEN_SIZES,
  LAYOUT as TOKEN_LAYOUT,
  HEADER as TOKEN_HEADER,
  MODAL as TOKEN_MODAL,
} from '@citewalk/design-tokens';

export const COLORS = TOKEN_COLORS;
export const SPACING = TOKEN_SPACING;
export const SIZES = TOKEN_SIZES;
export const LAYOUT = TOKEN_LAYOUT;
export const HEADER = TOKEN_HEADER;
export const MODAL = TOKEN_MODAL;

/** Cast token value for React Native ViewStyle/TextStyle (avoids string|number vs DimensionValue/ColorValue errors). */
export const toColor = (v: string | number): ColorValue => (typeof v === 'string' ? v : String(v)) as ColorValue;
export const toDimension = (v: string | number): number => (typeof v === 'number' ? v : Number(v));
/** For style props that accept DimensionValue (e.g. width, height, padding). Preserves string values like '100%'. */
export const toDimensionValue = (v: string | number): DimensionValue => v as DimensionValue;

/** Use when styles object uses theme tokens (MODAL/HEADER/SIZES) that TypeScript flags; keeps return type correct. */
export function createStyles<T extends Record<string, object>>(styles: T): T {
  return StyleSheet.create(styles as Record<string, object>) as T;
}

// Fonts: Inter for app shell (tabs, headers, buttons), IBM Plex Serif for content (feed, articles, intro)
export const FONTS = {
  // Inter - for app shell (tabs, headers, buttons, UI elements)
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  // IBM Plex Serif - for content (feed text, articles, intro)
  serifRegular: 'IBMPlexSerif_400Regular',
  serifSemiBold: 'IBMPlexSerif_600SemiBold',
  // Monospace (e.g. 2FA codes, inline code)
  mono: Platform.select({ ios: 'Menlo', android: 'monospace' }) ?? 'monospace',
};

/** Fixed profile header aspect ratio (width : height). Same on profile and draw modal so drawing matches header. 1 (square) allows enough room for avatar + bio. */
export const PROFILE_HEADER_ASPECT_RATIO = 1;

/** Opacity for draw canvas overlay (0–1). Used by DrawBackgroundModal for SVG fillOpacity. */
export const DRAW_CANVAS_OPACITY = 0.45;

/** @deprecated Use screenWidth / PROFILE_HEADER_ASPECT_RATIO for height. Kept for any legacy fallback. */
export const PROFILE_TOP_HEIGHT = 380;

/** Default FlatList performance props – use across lists for consistent behavior. */
export const FLATLIST_DEFAULTS = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 10,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 50,
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
};