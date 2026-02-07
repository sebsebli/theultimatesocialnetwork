import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useExplorationTrail } from "../context/ExplorationTrailContext";
import {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
  HEADER,
  createStyles,
} from "../constants/theme";

const STEP_ICONS: Record<string, string> = {
  topic: "tag",
  user: "person",
  post: "article",
  explore: "explore",
};

const ExplorationTrailInner = () => {
  const { trail, jumpTo, clearTrail, isActive } = useExplorationTrail();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to end when trail updates
  useEffect(() => {
    if (scrollRef.current && trail.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [trail.length]);

  const handleStepPress = (index: number) => {
    const step = trail[index];
    if (!step) return;
    jumpTo(index);
    router.push(step.href as any);
  };

  const handleHomePress = () => {
    clearTrail();
    router.push("/(tabs)");
  };

  if (!isActive) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.xs) }]}>
      {/* Home button — always first */}
      <Pressable
        onPress={handleHomePress}
        style={({ pressed }: { pressed: boolean }) => [
          styles.homeButton,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel="Home"
        accessibilityRole="button"
      >
        <MaterialIcons name="home" size={20} color={COLORS.secondary} />
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trail.map((step, i) => (
          <View key={`${step.type}-${step.id}-${i}`} style={styles.stepWrapper}>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={COLORS.tertiary}
              style={styles.separator}
            />
            <Pressable
              onPress={() => handleStepPress(i)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.stepButton,
                i === trail.length - 1 && styles.activeStep,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel={step.label}
              accessibilityRole="button"
            >
              <MaterialIcons
                name={(STEP_ICONS[step.type] ?? "circle") as any}
                size={14}
                color={
                  i === trail.length - 1 ? COLORS.paper : COLORS.secondary
                }
                style={styles.stepIcon}
              />
              <Text
                style={[
                  styles.stepText,
                  i === trail.length - 1 && styles.activeStepText,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Clear button */}
      <Pressable
        onPress={clearTrail}
        style={({ pressed }: { pressed: boolean }) => [
          styles.clearButton,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel="Clear trail"
        accessibilityRole="button"
      >
        <MaterialIcons name="close" size={18} color={COLORS.tertiary} />
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.ink,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    paddingVertical: SPACING.s + 2,
  },
  homeButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: SPACING.s,
    gap: 0,
    flexGrow: 1,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    marginHorizontal: 2,
  },
  stepButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs + 1,
    borderRadius: SIZES.borderRadius,
    gap: 5,
  },
  activeStep: {
    backgroundColor: COLORS.hover,
  },
  stepIcon: {
    marginRight: 0,
  },
  stepText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "500",
    maxWidth: 150,
    fontFamily: FONTS.medium,
  },
  activeStepText: {
    color: COLORS.paper,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  clearButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
  },
});

export const ExplorationTrail = React.memo(
  ExplorationTrailInner as unknown as React.FunctionComponent<
    Record<string, never>
  >,
) as React.ComponentType<Record<string, never>>;
