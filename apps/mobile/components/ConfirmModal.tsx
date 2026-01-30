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
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

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
        <View style={[styles.card, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.button,
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
                <Text style={[styles.confirmButtonText, destructive && styles.destructiveButtonText]}>
                  {confirmLabel}
                </Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: SPACING.xl,
    minWidth: 280,
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
  },
  message: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.m,
    justifyContent: 'flex-end',
  },
  button: {
    minHeight: 44,
    paddingHorizontal: SPACING.l,
    borderRadius: SIZES.borderRadiusPill,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
  cancelButton: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  destructiveButton: {
    backgroundColor: COLORS.error,
  },
  destructiveButtonText: {
    color: COLORS.paper,
  },
});
