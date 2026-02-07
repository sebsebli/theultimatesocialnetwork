import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";
import { InlineSkeleton } from "./LoadingSkeleton";

const REPORT_REASON_KEYS = [
  "spam",
  "harassment",
  "hate_speech",
  "violence",
  "misinformation",
  "illegal_content",
  "csam",
  "terrorism",
  "self_harm",
  "impersonation",
  "copyright",
  "privacy_violation",
  "nudity",
  "other",
] as const;

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReport: (reason: string, comment?: string) => Promise<void>;
  title?: string;
  targetType: "POST" | "REPLY" | "USER" | "DM" | "TOPIC" | "COLLECTION";
}

export function ReportModal({
  visible,
  onClose,
  onReport,
  title,
  targetType,
}: ReportModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await onReport(selectedReason, comment.trim() || undefined);
      setSelectedReason(null);
      setComment("");
      onClose();
    } catch (e) {
      // Caller shows error toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setComment("");
    onClose();
  };

  const displayTitle =
    title ??
    (targetType === "REPLY"
      ? t("post.reportTitle", "Report Comment")
      : t("post.reportTitle", "Report Post"));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[
          styles.fullscreen,
          // pageSheet on iOS already provides safe area; only Android fullscreen needs insets
          Platform.OS === "android" && { paddingTop: insets.top },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Pressable
            onPress={handleClose}
            style={styles.headerCloseBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <MaterialIcons name="close" size={24} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[
            styles.scrollInner,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon + description */}
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="flag" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.descriptionText}>
              {t(
                "post.reportDescription",
                "Help us keep Citewalk safe. Select a reason for your report and add any details that might help us review this content.",
              )}
            </Text>
          </View>

          {/* Reasons */}
          <Text style={styles.sectionLabel}>
            {t("post.reportSelectReason", "Select a reason")}
          </Text>
          {REPORT_REASON_KEYS.map((key) => {
            const label = t(`reportReasons.${key}`);
            const isSelected = selectedReason === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.reasonRow,
                  isSelected && styles.reasonRowSelected,
                ]}
                onPress={() => setSelectedReason(key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={label}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    isSelected && styles.reasonTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}

          {/* Free text */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.l }]}>
            {t("post.reportAdditionalDetails", "Additional details")}
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder={t(
              "post.reportCommentPlaceholder",
              "Describe what happened (optional)",
            )}
            placeholderTextColor={COLORS.tertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            editable={!submitting}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>

          {/* Submit */}
          <Pressable
            style={[
              styles.submitBtn,
              (!selectedReason || submitting) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
            accessibilityRole="button"
            accessibilityLabel={t("post.report", "Submit Report")}
          >
            {submitting ? (
              <InlineSkeleton />
            ) : (
              <Text style={styles.submitText}>
                {t("post.submitReport", "Submit Report")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = createStyles({
  fullscreen: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  headerCloseBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: "center",
    marginHorizontal: SPACING.s,
  },
  headerSpacer: {
    width: 24 + SPACING.xs * 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error + "18",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.m,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadius,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.hover,
    gap: SPACING.m,
  },
  reasonRowSelected: {
    backgroundColor: COLORS.primary + "15",
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  reasonTextSelected: {
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  commentInput: {
    minHeight: 100,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    textAlign: "right",
    marginTop: SPACING.xs,
    marginBottom: SPACING.m,
  },
  submitBtn: {
    minHeight: 48,
    paddingVertical: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.error,
    marginTop: SPACING.m,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    fontFamily: FONTS.semiBold,
  },
});
