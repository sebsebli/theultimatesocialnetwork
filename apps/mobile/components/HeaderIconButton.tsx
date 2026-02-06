import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { HEADER, createStyles } from "../constants/theme";

const ROOT_ROUTE = "/(tabs)";

export interface HeaderIconButtonProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel: string;
  accessibilityRole?: "button";
  style?: ViewStyle;
  iconColor?: string | number;
}

const SIZE =
  typeof HEADER.iconCircleSize === "number" ? HEADER.iconCircleSize : 40;
const RADIUS = SIZE / 2;
const BG =
  (HEADER as { iconCircleBackground?: string }).iconCircleBackground ??
  "rgba(0,0,0,0.35)";

const styles = createStyles({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  circlePressed: { opacity: 0.7 },
});

/** Width/height of the circle; use for spacer (e.g. empty left slot) to keep title centered. */
export const headerIconCircleSize = SIZE;
/** Horizontal margin each side of circle; spacer width = headerIconCircleSize + 2 * 4 */
export const headerIconCircleMarginH = 4;

/**
 * Header icon button with opacity circle (same style as full post/reading screen).
 * Use for back, more-horiz, close, etc. so all header buttons look and align the same.
 */
export function HeaderIconButton({
  onPress,
  icon,
  accessibilityLabel,
  accessibilityRole = "button",
  style,
  iconColor = HEADER.iconColor,
}: HeaderIconButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isBackButton = icon === "arrow-back";
  const handleLongPress = isBackButton
    ? () => router.replace(ROOT_ROUTE as "/")
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={({ pressed }: { pressed: boolean }) => [
        styles.circle,
        pressed && styles.circlePressed,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={
        isBackButton
          ? t("common.longPressToHome", "Long press to go to home")
          : undefined
      }
    >
      <MaterialIcons
        name={icon}
        size={HEADER.iconSize}
        color={typeof iconColor === "string" ? iconColor : String(iconColor)}
      />
    </Pressable>
  );
}
