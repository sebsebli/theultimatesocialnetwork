import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, MODAL, HEADER } from '../constants/theme';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  /** Red/destructive confirm button */
  destructive?: boolean;
  /** MaterialIcons name above title (e.g. 'warning', 'info-outline') */
  icon?: string;
}

/**
 * Production-grade confirmation modal. Replaces Alert.alert for two-button confirm/cancel flows.
 * onConfirm can be async; loading state is shown until it completes. On reject/throw, error toast is expected from caller.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  icon,
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onCancel(); // Close modal on success
    } catch (_e) {
      // Caller shows error via toast; we just stop loading
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={[styles.card, { paddingBottom: insets.bottom + SPACING.xl }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handleBar} />
          {icon ? (
            <MaterialIcons
              name={icon as any}
              size={32}
              color={destructive ? COLORS.error : COLORS.primary}
              style={styles.titleIcon}
            />
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button,
                styles.confirmButtonWrap,
                destructive ? styles.destructiveButton : styles.confirmButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={destructive ? COLORS.error : COLORS.ink} />
              ) : (
                <Text style={[styles.confirmButtonText, destructive && styles.destructiveButtonText]} numberOfLines={1}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: MODAL.backdropBackgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.m,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
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
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  titleIcon: {
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    paddingHorizontal: SPACING.xs,
  },
  actions: {
    flexDirection: 'column',
    gap: SPACING.s,
  },
  button: {
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: 14,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonWrap: {
    width: '100%',
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
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
  destructiveButton: {
    backgroundColor: MODAL.destructiveButtonBackgroundColor,
  },
  destructiveButtonText: {
    color: MODAL.destructiveButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
