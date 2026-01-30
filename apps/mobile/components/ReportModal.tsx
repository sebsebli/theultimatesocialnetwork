import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';

const REPORT_REASON_KEYS = ['spam', 'harassment', 'misinformation', 'violence', 'hate_speech', 'other'] as const;

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReport: (reason: string, comment?: string) => Promise<void>;
  title?: string;
  targetType: 'POST' | 'REPLY' | 'USER' | 'DM';
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
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await onReport(selectedReason, comment.trim() || undefined);
      setSelectedReason(null);
      setComment('');
      onClose();
    } catch (e) {
      // Caller shows error toast
    } finally {
      setSubmitting(false);
    }
  };

  const displayTitle = title ?? (targetType === 'REPLY' ? t('post.reportTitle', 'Report Comment') : t('post.reportTitle', 'Report Post'));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.xl }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{displayTitle}</Text>
          <Text style={styles.hint}>{t('post.reportSelectReason', 'Select a reason')}</Text>
          <ScrollView style={styles.reasonsScroll} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            {REPORT_REASON_KEYS.map((key) => {
              const label = t(`reportReasons.${key}`);
              const isSelected = selectedReason === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                  onPress={() => setSelectedReason(key)}
                >
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={HEADER.iconSize} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <TextInput
            style={styles.commentInput}
            placeholder={t('post.reportCommentPlaceholder', 'Additional details (optional)')}
            placeholderTextColor={COLORS.tertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, (!selectedReason || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.paper} />
              ) : (
                <Text style={styles.submitText}>{t('post.report', 'Report')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    maxHeight: '85%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.divider,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.tertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.l,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
  },
  reasonsScroll: {
    maxHeight: 220,
    marginBottom: SPACING.m,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadius,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.hover,
  },
  reasonRowSelected: {
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  reasonTextSelected: {
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  commentInput: {
    minHeight: 80,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.l,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.error,
    minHeight: 48,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.semiBold,
  },
});
