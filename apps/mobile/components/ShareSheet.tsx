import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Share as NativeShare,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  MODAL,
  createStyles,
} from "../constants/theme";
import { MessageRowSkeleton } from "./LoadingSkeleton";
import * as Clipboard from "expo-clipboard";
import { useToast } from "../context/ToastContext";
import { api, getWebAppBaseUrl } from "../utils/api";
import * as Haptics from "expo-haptics";

export interface ShareSheetOpenOptions {
  /** When true, public URL options (Copy link, Share via...) are hidden; only DM options shown. */
  authorIsProtected?: boolean;
}

export interface ShareSheetRef {
  open: (postId: string, options?: ShareSheetOpenOptions) => void;
  close: () => void;
}

interface ThreadItem {
  id: string;
  otherUser: { id: string; handle: string; displayName: string };
  lastMessage?: { body: string; createdAt: string } | null;
  unreadCount: number;
}

const ShareSheet = forwardRef<ShareSheetRef, Record<string, never>>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);
    const [postId, setPostId] = useState<string | null>(null);
    const [authorIsProtected, setAuthorIsProtected] = useState(false);
    const [threads, setThreads] = useState<ThreadItem[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { showSuccess } = useToast();

    useImperativeHandle(ref, () => ({
      open: (id: string, options?: ShareSheetOpenOptions) => {
        setPostId(id);
        setAuthorIsProtected(options?.authorIsProtected === true);
        setVisible(true);
      },
      close: () => setVisible(false),
    }));

    useEffect(() => {
      if (visible && postId) {
        setThreadsLoading(true);
        api
          .get<ThreadItem[]>("/messages/threads")
          .then((data) =>
            setThreads(Array.isArray(data) ? data.slice(0, 8) : []),
          )
          .catch(() => setThreads([]))
          .finally(() => setThreadsLoading(false));
      }
    }, [visible, postId]);

    const url = postId ? `${getWebAppBaseUrl()}/post/${postId}` : "";

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
          pathname: "/(tabs)/messages/new",
          params: { initialMessage: url },
        });
      }
    };

    const handleCopyLink = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVisible(false);
      if (postId) {
        const linkUrl = `${getWebAppBaseUrl()}/post/${postId}`;
        await Clipboard.setStringAsync(linkUrl);
        showSuccess(t("post.linkCopied", "Link copied to clipboard"));
      }
    };

    const handleShareSystem = async () => {
      setVisible(false);
      if (postId) {
        const linkUrl = `${getWebAppBaseUrl()}/post/${postId}`;
        try {
          await NativeShare.share({ message: linkUrl, url: linkUrl });
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
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + SPACING.xl },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>{t("post.shareTitle", "Share")}</Text>

            <Text style={styles.sectionLabel}>
              {t("post.sendDm", "Send as DM")}
            </Text>
            {threadsLoading ? (
              <View style={{ marginVertical: SPACING.m }}>
                <MessageRowSkeleton />
                <MessageRowSkeleton />
                <MessageRowSkeleton />
              </View>
            ) : threads.length > 0 ? (
              <ScrollView
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                style={styles.recentScroll}
                contentContainerStyle={styles.recentRow}
              >
                {threads.map((thread) => (
                  <Pressable
                    key={thread.id}
                    style={styles.recentContact}
                    onPress={() => handleSendToThread(thread.id)}
                    accessibilityLabel={
                      thread.otherUser.displayName ||
                      thread.otherUser.handle ||
                      t("post.unknownUser", "Unknown")
                    }
                    accessibilityRole="button"
                  >
                    <View style={styles.recentAvatar}>
                      <Text style={styles.recentAvatarText}>
                        {(
                          thread.otherUser.displayName ||
                          thread.otherUser.handle ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {thread.otherUser.displayName || thread.otherUser.handle}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            <Pressable
              style={styles.option}
              onPress={handleNewMessage}
              accessibilityLabel={t("messages.newMessage", "New message")}
              accessibilityRole="button"
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name="add-circle-outline"
                  size={HEADER.iconSize}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.optionText}>
                {t("messages.newMessage", "New message")}
              </Text>
            </Pressable>

            {!authorIsProtected && (
              <>
                <Text style={styles.sectionLabel}>
                  {t("post.otherWays", "Other ways")}
                </Text>
                <Pressable
                  style={styles.option}
                  onPress={handleCopyLink}
                  accessibilityLabel={t("post.copyLink", "Copy Link")}
                  accessibilityRole="button"
                >
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name="content-copy"
                      size={HEADER.iconSize}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.optionText}>
                    {t("post.copyLink", "Copy Link")}
                  </Text>
                </Pressable>

                <Pressable style={styles.option} onPress={handleShareSystem}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name="ios-share"
                      size={HEADER.iconSize}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.optionText}>
                    {t("post.shareSystem", "Share via...")}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.cancelText}>
                {t("common.cancel", "Cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    ) as React.ReactNode;
  },
);

const styles = createStyles({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL.backdropBackgroundColor,
  },
  sheet: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderTopLeftRadius: MODAL.sheetBorderRadius,
    borderTopRightRadius: MODAL.sheetBorderRadius,
    paddingHorizontal: MODAL.sheetPaddingHorizontal,
    paddingTop: MODAL.sheetPaddingTop,
    borderWidth: MODAL.sheetBorderWidth,
    borderBottomWidth: MODAL.sheetBorderBottomWidth,
    borderColor: MODAL.sheetBorderColor,
    maxHeight: "70%",
  },
  handle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: "center",
    marginTop: MODAL.handleMarginTop,
    marginBottom: MODAL.handleMarginBottom,
  },
  title: {
    fontSize: MODAL.sheetTitleFontSize,
    fontWeight: MODAL.sheetTitleFontWeight,
    color: MODAL.sheetTitleColor,
    textAlign: "center",
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  recentScroll: {
    marginBottom: SPACING.m,
  },
  recentRow: {
    flexDirection: "row",
    gap: SPACING.m,
    paddingVertical: SPACING.s,
  },
  recentContact: {
    alignItems: "center",
    width: 64,
  },
  recentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.hover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  recentAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  recentName: {
    fontSize: 12,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.s,
  },
  cancelButton: {
    marginTop: SPACING.l,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderRadius: MODAL.buttonBorderRadius,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  cancelText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React 19 forwardRef compatibility
export default ShareSheet as any;
