import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS, HEADER } from '../constants/theme';

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
}

/**
 * Unified app header: back (optional) + title + right.
 * No border. Uses MaterialIcons 24px, same padding and title style everywhere.
 */
export function ScreenHeader({
  title,
  showBack = true,
  onBack,
  left,
  right,
  paddingTop,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const top = paddingTop ?? insets.top;
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: top }, style]}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }: { pressed: boolean }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={HEADER_ICON_SIZE} color={HEADER.iconColor} />
          </Pressable>
        ) : (
          left ?? <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingBottom: HEADER.barPaddingBottom,
    backgroundColor: COLORS.ink,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: HEADER_TITLE_SIZE,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  iconBtn: {
    padding: SPACING.s,
    margin: -SPACING.s,
  },
  iconBtnPressed: {
    opacity: 0.7,
  },
  placeholder: {
    width: 40,
    height: 40,
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
