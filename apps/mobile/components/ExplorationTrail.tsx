import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useExplorationTrail } from "../context/ExplorationTrailContext";
import {
  COLORS,
  SPACING,
  FONTS,
  SIZES,
  createStyles,
} from "../constants/theme";

const ExplorationTrailInner = () => {
  const { trail, jumpTo, clearTrail, isActive } = useExplorationTrail();
  const router = useRouter();
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

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compass icon */}
        <Text style={styles.compassIcon}>🧭</Text>

        {trail.map((step, i) => (
          <View key={`${step.type}-${step.id}-${i}`} style={styles.stepWrapper}>
            {i > 0 && <Text style={styles.separator}>›</Text>}
            <Pressable
              onPress={() => handleStepPress(i)}
              style={[
                styles.stepButton,
                i === trail.length - 1 && styles.activeStep,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  i === trail.length - 1 && styles.activeStepText,
                ]}
                numberOfLines={1}
              >
                {step.type === "topic"
                  ? "# "
                  : step.type === "user"
                    ? "@ "
                    : ""}
                {step.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Clear button */}
      <Pressable onPress={clearTrail} style={styles.clearButton}>
        <Text style={styles.clearIcon}>✕</Text>
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.s,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    gap: 2,
    flexGrow: 1,
  },
  compassIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    color: COLORS.tertiary,
    fontSize: 14,
    marginHorizontal: SPACING.xs,
  },
  stepButton: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.borderRadius,
  },
  activeStep: {
    backgroundColor: COLORS.hover,
  },
  stepText: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 120,
    fontFamily: FONTS.medium,
  },
  activeStepText: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  clearButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
  },
  clearIcon: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
});

export const ExplorationTrail = React.memo(
  ExplorationTrailInner as unknown as React.FunctionComponent<
    Record<string, never>
  >,
) as React.ComponentType<Record<string, never>>;
