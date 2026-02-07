import React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  HEADER,
  FONTS,
  createStyles,
} from "../constants/theme";

export interface ActionButtonProps {
  /** MaterialIcons icon name */
  icon: string;
  /** Icon name for the active state (optional, defaults to `icon`) */
  activeIcon?: string;
  /** Whether the action is in an active state */
  active?: boolean;
  /** Color when active */
  activeColor?: string;
  /** Optional count to show next to the icon */
  count?: number;
  /** Press handler */
  onPress: () => void;
  /** Accessibility label */
  label: string;
  /** Optional animated scale value for like animation */
  scaleValue?: Animated.Value;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Standardized action button for post interactions.
 * Used consistently across PostItem, PostArticleBlock, and comments.
 */
export function ActionButton({
  icon,
  activeIcon,
  active = false,
  activeColor = COLORS.primary,
  count,
  onPress,
  label,
  scaleValue,
  size = "md",
}: ActionButtonProps): React.JSX.Element {
  const iconSize = size === "sm" ? 18 : HEADER.iconSize;
  const displayIcon = active && activeIcon ? activeIcon : icon;
  const iconColor = active ? activeColor : COLORS.tertiary;

  const iconElement = (
    <MaterialIcons
      name={displayIcon as any}
      size={iconSize}
      color={iconColor}
    />
  );

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {scaleValue ? (
        <View style={{ transform: [{ scale: scaleValue }] }}>
          {iconElement}
        </View>
      ) : (
        iconElement
      )}
      {count != null && count > 0 && (
        <Text style={styles.count}>{count}</Text>
      )}
    </Pressable>
  );
}

const styles = createStyles({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
  },
  count: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});
