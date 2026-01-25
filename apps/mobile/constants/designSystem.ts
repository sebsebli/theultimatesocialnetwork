/**
 * Design System - Standardized component styles
 * All components should use these patterns for consistency
 */

import { StyleSheet } from 'react-native';
import { COLORS, SPACING, SIZES, FONTS } from './theme';

/**
 * Standard Header Styles
 * Used across all screens with navigation
 */
export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flex: 1,
    textAlign: 'center',
  },
  titleLeft: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  actionButton: {
    padding: SPACING.xs,
    minWidth: SIZES.iconLarge,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: SIZES.iconLarge,
  },
});

/**
 * Standard Button Styles
 */
export const buttonStyles = StyleSheet.create({
  // Primary button (filled)
  primary: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  primaryDisabled: {
    opacity: 0.5,
  },

  // Secondary button (outline)
  secondary: {
    height: 38,
    minWidth: 120,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  secondaryActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondaryTextActive: {
    color: '#FFFFFF',
  },

  // Pill button (small)
  pill: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: SIZES.borderRadiusPill,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Text button (link style)
  text: {
    padding: SPACING.s,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});

/**
 * Standard Input Styles
 */
export const inputStyles = StyleSheet.create({
  // Standard text input
  text: {
    height: 50,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  textUnderline: {
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingHorizontal: 0,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingHorizontal: 0,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    textAlignVertical: 'top',
  },

  // Search input
  search: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },

  // Label
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  charCount: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});

/**
 * Standard Card/Container Styles
 */
export const cardStyles = StyleSheet.create({
  // Standard card
  card: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    marginHorizontal: SPACING.l,
  },

  // List item
  listItem: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  // Section
  section: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
});

/**
 * Standard Typography Styles
 */
export const typographyStyles = StyleSheet.create({
  // Titles
  titleLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },

  // Labels
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  labelMedium: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },

  // Body text
  body: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  bodySecondary: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  bodyTertiary: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },

  // Metadata
  metadata: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});

/**
 * Standard Tab Styles
 */
export const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
  },
});

/**
 * Standard Modal Styles
 */
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.m,
    marginTop: SPACING.l,
  },
  buttonCancel: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  buttonConfirm: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  buttonTextCancel: {
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  buttonTextConfirm: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});

/**
 * Standard Empty State Styles
 */
export const emptyStateStyles = StyleSheet.create({
  container: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

/**
 * Standard Toggle/Switch Styles
 */
export const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.tertiary,
  },
  thumbActive: {
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
  },
});

export default {
  headerStyles,
  buttonStyles,
  inputStyles,
  cardStyles,
  typographyStyles,
  tabStyles,
  modalStyles,
  emptyStateStyles,
  toggleStyles,
};
