import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import { InlineSkeleton } from "../../components/LoadingSkeleton";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  MODAL,
  createStyles,
} from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DangerZoneScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const handleDeleteAccount = () => {
    setDeleteReason("");
    setDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const lang =
        (typeof navigator !== "undefined" &&
          (navigator.language || "").slice(0, 2)) ||
        "en";
      await api.post("/users/me/request-deletion", {
        reason: deleteReason.trim() || undefined,
        lang,
      });
      setDeleteAccountModalVisible(false);
      setDeleteReason("");
      showSuccess(
        t(
          "settings.deletionEmailSent",
          "Check your email and click the link within 24 hours to delete your account.",
        ),
      );
    } catch (e: unknown) {
      const errorMessage = (e as { message?: string })?.message;
      showError(
        errorMessage ||
          t("settings.deleteAccountFailed", "Failed to delete account"),
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("settings.dangerZone", "Danger zone")}
        paddingTop={insets.top}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>
            {t("settings.dangerZone", "Danger zone")}
          </Text>
          <Text style={styles.dangerZoneHint}>
            {t(
              "settings.dangerZoneHint",
              "These actions are permanent and cannot be undone.",
            )}
          </Text>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.dangerZoneItem,
              pressed && styles.itemPressed,
            ]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            accessibilityLabel={t("settings.deleteAccount", "Delete account")}
            accessibilityRole="button"
          >
            {deletingAccount ? (
              <InlineSkeleton />
            ) : (
              <MaterialIcons
                name="delete-forever"
                size={HEADER.iconSize}
                color={COLORS.error}
              />
            )}
            <Text style={styles.dangerZoneItemLabel}>
              {t("settings.deleteAccount", "Delete account")}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={HEADER.iconSize}
              color={COLORS.tertiary}
            />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.deleteModalOverlay}
          onPress={() => {
            setDeleteAccountModalVisible(false);
            setDeleteReason("");
          }}
        >
          <View
            style={[
              styles.deleteModalCard,
              { paddingBottom: insets.bottom + SPACING.l },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.deleteModalTitleRow}>
              <MaterialIcons
                name="warning"
                size={28}
                color={COLORS.error}
                style={styles.deleteModalTitleIcon}
              />
              <Text style={styles.deleteModalTitle}>
                {t("settings.deleteAccount", "Delete account")}
              </Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              {t(
                "settings.deleteAccountConfirmEmail",
                "We will send a confirmation link to your email. Click it within 24 hours to permanently delete your account.",
              )}
            </Text>
            <Text style={styles.deleteModalLabel}>
              {t(
                "settings.deleteReasonOptional",
                "Reason for leaving (optional, for our records)",
              )}
            </Text>
            <TextInput
              style={styles.deleteReasonInput}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder={t(
                "settings.deleteReasonPlaceholder",
                "e.g. privacy, not using anymore",
              )}
              placeholderTextColor={COLORS.tertiary}
              multiline
              numberOfLines={2}
              maxLength={500}
              editable={!deletingAccount}
            />
            <View style={styles.deleteModalActions}>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [
                  styles.deleteModalButton,
                  styles.deleteModalCancel,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setDeleteAccountModalVisible(false);
                  setDeleteReason("");
                }}
                disabled={deletingAccount}
                accessibilityLabel={t("common.cancel", "Cancel")}
                accessibilityRole="button"
              >
                <Text style={styles.deleteModalCancelText}>
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [
                  styles.deleteModalButton,
                  styles.deleteModalConfirm,
                  pressed && styles.buttonPressed,
                  deletingAccount && styles.buttonDisabled,
                ]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
                accessibilityLabel={t("settings.sendDeletionLink", "Send confirmation email")}
                accessibilityRole="button"
              >
                {deletingAccount ? (
                  <InlineSkeleton />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>
                    {t("settings.sendDeletionLink", "Send confirmation email")}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.xl,
    paddingBottom: 40,
  },
  dangerZone: {
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.error,
    textTransform: "uppercase",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  dangerZoneHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.s,
    fontFamily: FONTS.regular,
  },
  dangerZoneItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    gap: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  itemPressed: { backgroundColor: COLORS.hover },
  dangerZoneItemLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.error,
    fontFamily: FONTS.medium,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: MODAL.backdropBackgroundColor,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.l,
  },
  deleteModalCard: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderRadius: MODAL.sheetBorderRadius,
    borderWidth: MODAL.sheetBorderWidth,
    borderColor: MODAL.sheetBorderColor,
    padding: SPACING.xl,
    minWidth: 280,
    maxWidth: 340,
  },
  deleteModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  deleteModalTitleIcon: { marginRight: SPACING.s },
  deleteModalTitle: {
    flex: 1,
    fontSize: MODAL.sheetTitleFontSize,
    fontWeight: MODAL.sheetTitleFontWeight,
    color: MODAL.sheetTitleColor,
    fontFamily: FONTS.semiBold,
  },
  deleteModalMessage: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.m,
  },
  deleteModalLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  deleteReasonInput: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    minHeight: 56,
    marginBottom: SPACING.xl,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: SPACING.m,
    justifyContent: "flex-end",
  },
  deleteModalButton: {
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 88,
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
  deleteModalCancel: {
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  deleteModalCancelText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
  deleteModalConfirm: {
    backgroundColor: MODAL.destructiveButtonBackgroundColor,
  },
  deleteModalConfirmText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.destructiveButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
