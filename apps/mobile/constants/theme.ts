/** Design tokens from @citewalk/design-tokens – single source of truth with web */
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

/** Fixed profile header aspect ratio (width : height = 4 : 3). Same on all devices so drawings look identical. */
export const PROFILE_HEADER_ASPECT_RATIO = 4 / 3;

/** Opacity for draw canvas overlay (0–1). Used by DrawBackgroundModal for SVG fillOpacity. */
export const DRAW_CANVAS_OPACITY = 0.45;

/** @deprecated Use screenWidth / PROFILE_HEADER_ASPECT_RATIO for height. Kept for any legacy fallback. */
export const PROFILE_TOP_HEIGHT = 380;

export default {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
  LAYOUT,
  HEADER,
  MODAL,
};