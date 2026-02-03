import React from 'react';
import { View, ActivityIndicator, Text, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, createStyles } from '../constants/theme';

export interface ImageVerifyingOverlayProps {
  visible: boolean;
  /** Optional custom message (defaults to "Uploading & verifying image...") */
  message?: string;
}

/**
 * Full-screen overlay shown while an image is being uploaded and verified (AI safety check).
 * Use for profile picture, header image, and post title image uploads.
 */
export function ImageVerifyingOverlay({ visible, message }: ImageVerifyingOverlayProps) {
  const { t } = useTranslation();
  const text = message ?? t('common.verifyingImage', 'Uploading & verifying image…');

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.ink,
    borderRadius: 12,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.l,
    minWidth: 260,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  message: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});
