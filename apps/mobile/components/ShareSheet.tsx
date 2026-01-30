import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Share as NativeShare, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export interface ShareSheetRef {
  open: (postId: string) => void;
  close: () => void;
}

interface ThreadItem {
  id: string;
  otherUser: { id: string; handle: string; displayName: string };
  lastMessage?: { body: string; createdAt: string } | null;
  unreadCount: number;
}

// @ts-ignore
const ShareSheet = forwardRef((props: {}, ref: React.ForwardedRef<ShareSheetRef>) => {
  const [visible, setVisible] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
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

  useEffect(() => {
    if (visible && postId) {
      setThreadsLoading(true);
      api.get<ThreadItem[]>('/messages/threads')
        .then((data) => setThreads(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(() => setThreads([]))
        .finally(() => setThreadsLoading(false));
    }
  }, [visible, postId]);

  const url = postId ? `https://cite.app/post/${postId}` : '';

  const handleSendToThread = (threadId: string) => {
    setVisible(false);
    if (postId) {
      router.push({
        pathname: `/(tabs)/messages/${threadId}`,
        params: { initialMessage: url },
      });
    }
  };

  const handleNewMessage = () => {
    setVisible(false);
    if (postId) {
      router.push({
        pathname: '/(tabs)/messages/new',
        params: { initialMessage: url },
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
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('post.shareTitle', 'Share')}</Text>

          <Text style={styles.sectionLabel}>{t('post.sendDm', 'Send as DM')}</Text>
          {threadsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.m }} />
          ) : threads.length > 0 ? (
            <ScrollView horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={styles.recentScroll} contentContainerStyle={styles.recentRow}>
              {threads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={styles.recentContact}
                  onPress={() => handleSendToThread(thread.id)}
                >
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>
                      {(thread.otherUser.displayName || thread.otherUser.handle || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.recentName} numberOfLines={1}>{thread.otherUser.displayName || thread.otherUser.handle}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <Pressable style={styles.option} onPress={handleNewMessage}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="add-circle-outline" size={HEADER.iconSize} color={COLORS.primary} />
            </View>
            <Text style={styles.optionText}>{t('messages.newMessage', 'New message')}</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>{t('post.otherWays', 'Other ways')}</Text>
          <Pressable style={styles.option} onPress={handleCopyLink}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="content-copy" size={HEADER.iconSize} color={COLORS.primary} />
            </View>
            <Text style={styles.optionText}>{t('post.copyLink', 'Copy Link')}</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={handleShareSystem}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="ios-share" size={HEADER.iconSize} color={COLORS.primary} />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderBottomWidth: 0,
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    textAlign: 'center',
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  recentScroll: {
    marginBottom: SPACING.m,
  },
  recentRow: {
    flexDirection: 'row',
    gap: SPACING.m,
    paddingVertical: SPACING.s,
  },
  recentContact: {
    alignItems: 'center',
    width: 64,
  },
  recentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  recentAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  recentName: {
    fontSize: 12,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
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
