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

export default {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
};