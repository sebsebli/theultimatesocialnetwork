import React, { memo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS, HEADER, createStyles } from '../constants/theme';
import { HeaderIconButton, headerIconCircleSize, headerIconCircleMarginH } from './HeaderIconButton';

const HEADER_ICON_SIZE = HEADER.iconSize;
const HEADER_TITLE_SIZE = HEADER.titleSize;

export interface ScreenHeaderProps {
  /** Title (centered when back + right are balanced) */
  title: string;
  /** Show back button (uses router.back() or onBack if provided) */
  showBack?: boolean;
  /** Custom back handler; when provided, used instead of router.back() (e.g. to return to a specific route) */
  onBack?: () => void;
  /** Custom left element; ignored if showBack is true */
  left?: React.ReactNode;
  /** Right element (e.g. save, more). Use empty <View style={{ width: 40 }} /> for balance. */
  right?: React.ReactNode;
  /** Optional top padding override (default: insets.top) */
  paddingTop?: number;
  /** Optional container style */
  style?: ViewStyle;
  /** MaterialIcons name shown next to title (e.g. 'settings' for Settings screen) */
  titleIcon?: string;
}

/**
 * Unified app header: back (optional) + title + right.
 * No border. Uses MaterialIcons 24px, same padding and title style everywhere.
 */
function ScreenHeaderInner({
  title,
  showBack = true,
  onBack,
  left,
  right,
  paddingTop,
  style,
  titleIcon,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const top = paddingTop ?? insets.top;
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: top }, style]}>
      <View style={styles.side}>
        {showBack ? (
          <HeaderIconButton onPress={handleBack} icon="arrow-back" accessibilityLabel="Go back" />
        ) : (
          left ?? <View style={styles.placeholder} />
        )}
      </View>
      <View style={styles.titleRow}>
        {titleIcon ? (
          <MaterialIcons name={titleIcon as keyof typeof MaterialIcons.glyphMap} size={HEADER_ICON_SIZE} color={HEADER.iconColor} style={styles.titleIcon} />
        ) : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={[styles.side, styles.sideRight]}>
        {right ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

export const ScreenHeader = memo(ScreenHeaderInner as React.FunctionComponent<ScreenHeaderProps>) as (props: ScreenHeaderProps) => React.ReactElement | null;

const styles = createStyles({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingBottom: HEADER.barPaddingBottom,
    backgroundColor: COLORS.ink,
  },
  side: {
    minWidth: headerIconCircleSize + headerIconCircleMarginH * 2,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    marginRight: SPACING.xs,
  },
  title: {
    flex: 0,
    fontSize: HEADER_TITLE_SIZE,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  placeholder: {
    width: headerIconCircleSize + headerIconCircleMarginH * 2,
    height: headerIconCircleSize,
  },
  /** Use for Save (or other text) in right slot - same look everywhere */
  rightText: {
    fontSize: 16,
    fontWeight: '600',
    color: HEADER.saveColor,
    fontFamily: FONTS.semiBold,
  },
  rightTextCancel: {
    fontSize: 16,
    color: HEADER.cancelColor,
    fontFamily: FONTS.medium,
  },
});

export const headerRightSaveStyle = styles.rightText;
export const headerRightCancelStyle = styles.rightTextCancel;
