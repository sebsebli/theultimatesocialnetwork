import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Share as NativeShare } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../context/ToastContext';

export interface ShareSheetRef {
  open: (postId: string) => void;
  close: () => void;
}

// @ts-ignore
const ShareSheet = forwardRef((props: {}, ref: React.ForwardedRef<ShareSheetRef>) => {
  const [visible, setVisible] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess } = useToast();

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setPostId(id);
      setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const handleSendDM = () => {
    setVisible(false);
    if (postId) {
      const url = `https://cite.app/post/${postId}`;
      router.push({
        pathname: '/(tabs)/messages/new',
        params: { initialMessage: url }
      });
    }
  };

  const handleCopyLink = async () => {
    setVisible(false);
    if (postId) {
      const url = `https://cite.app/post/${postId}`;
      await Clipboard.setStringAsync(url);
      showSuccess(t('post.linkCopied', 'Link copied to clipboard'));
    }
  };

  const handleShareSystem = async () => {
    setVisible(false);
    if (postId) {
      const url = `https://cite.app/post/${postId}`;
      try {
        await NativeShare.share({ message: url });
      } catch (e) {
        // console.error(e);
      }
    }
  };

  const handleAddToCollection = () => {
    // This should trigger the add to collection sheet.
    // Since that sheet is likely in the parent or global, we might need a callback.
    // For now, let's just close this and let the user click the explicit 'Add' button,
    // or we could pass an onAddToCollection prop. 
    // Given the architecture, maybe we just redirect to the post detail where 'Add' is prominent?
    // Or better: The parent PostItem calls this. Let's assume the parent handles 'Add' separately
    // via the explicit button, but if we want it here, we'd need to coordinate.
    // For simplicity in this 'Share' context:
    setVisible(false);
    // Ideally invoke onAddToCollection from props if we added it.
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('post.shareTitle', 'Share')}</Text>
          
          <Pressable style={styles.option} onPress={handleSendDM}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="mail-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.optionText}>{t('post.sendDm', 'Send as DM')}</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={handleCopyLink}>
             <View style={styles.iconContainer}>
              <MaterialIcons name="content-copy" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.optionText}>{t('post.copyLink', 'Copy Link')}</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={handleShareSystem}>
             <View style={styles.iconContainer}>
              <MaterialIcons name="ios-share" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.optionText}>{t('post.shareSystem', 'Share via...')}</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => setVisible(false)}>
            <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  ) as unknown as React.JSX.Element;
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.s,
  },
  cancelButton: {
    marginTop: SPACING.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
});

export default ShareSheet as any;
