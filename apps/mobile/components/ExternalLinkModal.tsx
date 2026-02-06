import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  MODAL,
  createStyles,
} from "../constants/theme";

export interface ExternalLinkModalProps {
  visible: boolean;
  title: string;
  message: string;
  openLabel: string;
  cancelLabel: string;
  onOpen: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal before opening an external link in the in-app browser.
 * Matches app modal design (ConfirmModal style).
 */
export function ExternalLinkModal({
  visible,
  title,
  message,
  openLabel,
  cancelLabel,
  onOpen,
  onCancel,
}: ExternalLinkModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={styles.overlay}
        onPress={onCancel}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <View
          style={[styles.card, { paddingBottom: insets.bottom + SPACING.xl }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handleBar} />
          <MaterialIcons
            name="open-in-new"
            size={32}
            color={COLORS.primary}
            style={styles.titleIcon}
          />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button,
                styles.confirmButtonWrap,
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onOpen}
              accessibilityLabel={openLabel}
              accessibilityRole="button"
            >
              <Text
                style={styles.confirmButtonText}
                numberOfLines={1}
              >
                {openLabel}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    backgroundColor: MODAL.backdropBackgroundColor,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.m,
    width: "100%",
    maxWidth: 360,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  handleBar: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: "center",
    marginBottom: SPACING.l,
  },
  titleIcon: {
    alignSelf: "center",
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.m,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.xl,
    textAlign: "center",
    paddingHorizontal: SPACING.xs,
  },
  actions: {
    flexDirection: "column",
    gap: SPACING.s,
  },
  button: {
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: 14,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonWrap: {
    width: "100%",
  },
  buttonPressed: { opacity: 0.8 },
  cancelButton: {
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  cancelButtonText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
  confirmButton: {
    backgroundColor: MODAL.primaryButtonBackgroundColor,
  },
  confirmButtonText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.primaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
