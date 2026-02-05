import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Share,
  InteractionManager,
  Platform,
  useWindowDimensions,
  StyleSheet,
  type DimensionValue,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  api,
  getApiBaseUrl,
  getWebAppBaseUrl,
  getImageUrl,
  getAvatarUri,
} from "../../utils/api";
import { useAuth } from "../../context/auth";
import { useToast } from "../../context/ToastContext";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ReportModal } from "../../components/ReportModal";
import { OptionsActionSheet } from "../../components/OptionsActionSheet";
import { PostItem } from "../../components/PostItem";
import { MarkdownText } from "../../components/MarkdownText";
import {
  ProfileSkeleton,
  PostSkeleton,
  FeedSkeleton,
} from "../../components/LoadingSkeleton";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
  FLATLIST_DEFAULTS,
  LIST_SCROLL_DEFAULTS,
  TABS,
  TAB_BAR_HEIGHT,
  LIST_PADDING_EXTRA,
} from "../../constants/theme";
import { ListFooterLoader } from "../../components/ListFooterLoader";
import { HeaderIconButton } from "../../components/HeaderIconButton";
import { formatCompactNumber } from "../../utils/format";

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { handle } = useLocalSearchParams();
  const { t } = useTranslation();
  const { userId: authUserId } = useAuth();
  const { showError, showSuccess } = useToast();
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [muteConfirmVisible, setMuteConfirmVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportTargetType, setReportTargetType] = useState<
    "POST" | "REPLY" | "USER" | "DM"
  >("USER");
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const isOwnProfile = !!user && !!authUserId && user.id === authUserId;
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [following, setFollowing] = useState(false);
  const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "posts" | "replies" | "quotes" | "cited" | "saved" | "collections"
  >("posts");
  const loadingMoreRef = React.useRef(false);

  // When viewing someone else's profile, replies tab is hidden; switch away if it was selected
  useEffect(() => {
    if (user && !isOwnProfile && activeTab === "replies") {
      setActiveTab("posts");
    }
  }, [user, isOwnProfile, activeTab]);

  useEffect(() => {
    const h = typeof handle === "string" ? handle : handle?.[0];
    if (h) loadProfile(1, true);
  }, [handle]);

  // Refetch list when tab changes. Skip only the very first run when still on default tab (handle effect loads posts).
  const isFirstTabMount = React.useRef(true);
  useEffect(() => {
    if (!user) return;
    if (isFirstTabMount.current) {
      isFirstTabMount.current = false;
      if (activeTab === "posts") return;
    }
    loadProfile(1, true);
  }, [activeTab]);

  const loadProfile = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      loadingMoreRef.current = false;
      // Don't clear posts immediately to avoid flash, unless explicitly needed
      // setPosts([]);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      // Parallelize user fetch and content fetch for first load
      const handleStr =
        typeof handle === "string" ? handle : (handle?.[0] ?? "");
      const userPromise = reset
        ? api.get(`/users/${handleStr}`)
        : Promise.resolve(user);

      let endpoint = "";
      if (activeTab === "replies")
        endpoint = `/users/${user?.id || handle}/replies`; // Use handle if user not yet loaded (API supports handle lookup?)
      // Actually, API usually needs ID for relations.
      // Strategy: If resetting, we MUST wait for user ID from first call if we don't have it.
      // But if we have 'user' state, we can run parallel.

      const fetchContent = async (userId: string) => {
        let path;
        if (activeTab === "saved") path = `/keeps?page=${pageNum}&limit=20`;
        else if (activeTab === "replies")
          path = `/users/${userId}/replies?page=${pageNum}&limit=20`;
        else if (activeTab === "quotes")
          path = `/users/${userId}/quotes?page=${pageNum}&limit=20`;
        else if (activeTab === "cited")
          path = `/users/${userId}/cited?page=${pageNum}&limit=20`;
        else if (activeTab === "collections")
          path = `/users/${userId}/collections?page=${pageNum}&limit=20`;
        else
          path = `/users/${userId}/posts?page=${pageNum}&limit=20&type=posts`;
        return api.get(path);
      };

      let userData = user;
      let contentData;

      if (reset) {
        userData = await userPromise;
        setUser(userData);
        setFollowing(!!(userData as any).isFollowing);
        setHasPendingFollowRequest(!!(userData as any).hasPendingFollowRequest);
        const canViewContent =
          !(userData as any).isProtected || (userData as any).isFollowing;
        contentData = canViewContent
          ? await fetchContent(userData.id)
          : { items: [], hasMore: false };
      } else {
        const canViewContent = !user?.isProtected || following;
        contentData = canViewContent
          ? await fetchContent(user.id)
          : { items: [], hasMore: false };
      }

      // API may return { items, hasMore } or plain array for replies/quotes
      let rawItems = Array.isArray(contentData)
        ? contentData
        : Array.isArray(contentData?.items)
          ? contentData.items
          : (contentData?.items ?? []);
      // Saved tab: items are keeps with .post; normalize to posts for list
      const items =
        activeTab === "saved"
          ? (rawItems as any[]).map((k: any) => k.post).filter(Boolean)
          : rawItems;

      if (reset) {
        setPosts(items);
      } else {
        setPosts((prev) => [...prev, ...items]);
      }

      const hasMoreData = items.length >= 20 && contentData?.hasMore !== false;
      // Saved tab: use raw keeps length for hasMore
      const hasMoreSaved =
        activeTab === "saved" ? contentData?.hasMore === true : hasMoreData;
      setHasMore(activeTab === "saved" ? hasMoreSaved : hasMoreData);
      if (!reset) setPage(pageNum);
    } catch (error: any) {
      console.error("Failed to load profile", error);
      if (reset && activeTab === "posts") setUser(null);
      if (reset) setPosts([]);
      setHasMore(false);
      // User no longer exists (404) → go back instead of showing empty page
      if (reset && error?.status === 404) {
        router.back();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // ... (inside handleFollow)
  const handleFollow = async () => {
    if (!authUserId) {
      router.replace("/welcome");
      return;
    }
    const prevFollowing = following;
    const prevPending = hasPendingFollowRequest;
    const prevCount = user.followerCount;

    if (prevFollowing || prevPending) {
      setFollowing(false);
      setHasPendingFollowRequest(false);
      setUser((prev: any) => ({
        ...prev,
        followerCount: prev.followerCount - 1,
      }));
    } else {
      setFollowing(true); // optimistic; may be overwritten if pending
      setUser((prev: any) => ({
        ...prev,
        followerCount: prev.followerCount + 1,
      }));
    }

    try {
      if (prevFollowing || prevPending) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        const res = await api.post<{ pending?: boolean }>(
          `/users/${user.id}/follow`,
        );
        if (res?.pending) {
          setFollowing(false);
          setHasPendingFollowRequest(true);
          setUser((prev: any) => ({
            ...prev,
            followerCount: prev.followerCount - 1,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow", error);
      setFollowing(prevFollowing);
      setHasPendingFollowRequest(prevPending);
      setUser((prev: any) => ({ ...prev, followerCount: prevCount }));
    }
  };

  const handleMessage = async () => {
    if (!authUserId) {
      router.replace("/welcome");
      return;
    }
    try {
      const thread = await api.post("/messages/threads", { userId: user.id });
      if (thread && thread.id) {
        router.push(`/(tabs)/messages/${thread.id}`);
      }
    } catch (error: any) {
      console.error("Failed to create thread", error);
      if (error?.status === 403) {
        showError(
          t(
            "messages.mustFollowOrPrior",
            "You can only message people who follow you back or who you've messaged before.",
          ),
        );
      } else {
        showError(
          t(
            "messages.createThreadFailed",
            "Could not start conversation. Try again.",
          ),
        );
      }
    }
  };

  const handleBlock = () => setBlockConfirmVisible(true);

  const confirmBlock = async () => {
    try {
      await api.post(`/safety/block/${user.id}`);
      showSuccess(t("safety.blockedMessage", "This user has been blocked."));
      router.back();
    } catch (error) {
      console.error("Failed to block user", error);
      showError(t("safety.failedBlock", "Failed to block user."));
      throw error;
    }
  };

  const handleMute = () => setMuteConfirmVisible(true);

  const confirmMute = async () => {
    try {
      await api.post(`/safety/mute/${user.id}`);
      showSuccess(t("safety.mutedMessage", "This user has been muted."));
    } catch (error) {
      console.error("Failed to mute user", error);
      showError(t("safety.failedMute", "Failed to mute user."));
      throw error;
    }
  };

  const handleUserMenu = () => setOptionsModalVisible(true);

  const rssFeedUrl = `${getApiBaseUrl()}/rss/${encodeURIComponent(user?.handle ?? "")}`;

  const handleOpenRssFeed = useCallback(() => {
    if (!user?.handle) return;
    setOptionsModalVisible(false);
    Linking.openURL(rssFeedUrl);
  }, [user?.handle, rssFeedUrl]);

  const handleShareProfile = useCallback(() => {
    if (!user?.handle) return;
    setOptionsModalVisible(false);
    const profileUrl = `${getWebAppBaseUrl()}/user/${encodeURIComponent(user.handle)}`;
    const displayName = user.displayName || user.handle;
    const message = t("profile.shareProfileMessage", {
      defaultValue: "Check out {{name}} (@{{handle}}) on Citewalk",
      name: displayName,
      handle: user.handle,
    });
    const title = t("profile.shareProfileTitle", {
      defaultValue: "Share profile",
      handle: user.handle,
    });
    // Defer share until modal has fully closed (avoids share sheet not opening)
    InteractionManager.runAfterInteractions(() => {
      const sharePayload =
        Platform.OS === "android"
          ? { message: `${message}\n${profileUrl}`, title }
          : { message: `${message}\n${profileUrl}`, url: profileUrl, title };
      setTimeout(() => Share.share(sharePayload).catch(() => {}), 350);
    });
  }, [user?.handle, user?.displayName, t]);

  const openReportModal = (
    targetId: string,
    type: "POST" | "REPLY" | "USER",
  ) => {
    setReportTargetId(targetId);
    setReportTargetType(type);
    setReportModalVisible(true);
  };

  const handleReportSubmit = async (reason: string, comment?: string) => {
    if (!reportTargetId) return;
    await api.post("/safety/report", {
      targetId: reportTargetId,
      targetType: reportTargetType,
      reason,
      comment,
    });
    showSuccess(t("safety.reportSuccess", "Report submitted successfully"));
  };

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !user || loadingMoreRef.current)
      return;
    const nextPage = page + 1;
    loadProfile(nextPage, false);
  }, [loading, loadingMore, hasMore, page, user]);

  const handleTabChange = useCallback(
    (tab: typeof activeTab) => {
      if (tab === activeTab) return;
      setPosts([]);
      setPage(1);
      setLoading(true);
      setHasMore(true);
      setActiveTab(tab);
    },
    [activeTab],
  );

  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + LIST_PADDING_EXTRA;

  if (loading && !user) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: bottomPadding },
        ]}
      >
        <View style={styles.headerBar} />
        <ProfileSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("profile.userNotFound")}</Text>
      </View>
    );
  }

  if (user.isBlockedByMe) {
    return (
      <View style={styles.container}>
        <View style={[styles.blockedHeaderBar, { paddingTop: insets.top }]}>
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel="Go back"
          />
        </View>
        <View style={styles.blockedStateContent}>
          <MaterialIcons
            name="block"
            size={64}
            color={COLORS.tertiary}
            style={styles.blockedStateIcon}
          />
          <Text style={styles.blockedStateTitle}>
            {t("safety.youBlockedThisAccount", "You have blocked this account")}
          </Text>
          <Text style={styles.blockedStateSubtext}>
            {t(
              "safety.blockedAccountHint",
              "You cannot view this profile while blocked. Unblock to see their posts and profile.",
            )}
          </Text>
          <Pressable
            style={styles.blockedStateUnblockBtn}
            onPress={async () => {
              try {
                await api.delete(`/safety/block/${user.id}`);
                showSuccess(
                  t("safety.unblockedMessage", "This user has been unblocked."),
                );
                loadProfile(1, true);
              } catch (e: any) {
                showError(
                  e?.message ??
                    t("safety.failedUnblock", "Failed to unblock user."),
                );
              }
            }}
            accessibilityLabel={t("safety.unblock", "Unblock")}
            accessibilityRole="button"
          >
            <Text style={styles.blockedStateUnblockBtnText}>
              {t("safety.unblock", "Unblock")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Private profile when not following: only profile header + gate, no posts/tabs/empty state and no followers/following
  if (user.isProtected && !following) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentInset={Platform.OS === "ios" ? { top: insets.top } : undefined}
          contentOffset={
            Platform.OS === "ios" ? { x: 0, y: -insets.top } : undefined
          }
          contentContainerStyle={[
            styles.privateProfileScrollContent,
            { paddingBottom: bottomPadding },
          ]}
        >
          <View style={styles.profileListHeader}>
            <View
              style={[
                styles.profileHeaderContainer,
                styles.profileHeaderContainerBorder,
                { paddingTop: Platform.OS === "ios" ? 0 : insets.top },
              ]}
            >
              <View style={styles.headerBar}>
                <HeaderIconButton
                  onPress={() => router.back()}
                  icon="arrow-back"
                  accessibilityLabel="Go back"
                />
                <HeaderIconButton
                  onPress={() => handleUserMenu()}
                  icon="more-horiz"
                  accessibilityLabel="More options"
                />
              </View>
              <View style={styles.profileHeaderContent}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {getAvatarUri(user) ? (
                      <Image
                        source={{ uri: getAvatarUri(user)! }}
                        style={styles.avatarImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {user.displayName?.charAt(0) ||
                          user.handle?.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.identityBlock}>
                  <Text style={styles.name}>{user.displayName}</Text>
                  <Text style={styles.handle}>@{user.handle}</Text>
                </View>
                {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
                <View style={styles.actions}>
                  <Pressable
                    style={[
                      styles.actionButtonOutline,
                      (following || hasPendingFollowRequest) &&
                        styles.actionButtonActive,
                    ]}
                    onPress={handleFollow}
                    accessibilityLabel={
                      hasPendingFollowRequest
                        ? t("profile.requested", "Requested")
                        : following
                          ? t("profile.following")
                          : t("profile.follow")
                    }
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        (following || hasPendingFollowRequest) &&
                          styles.actionButtonTextActive,
                      ]}
                    >
                      {hasPendingFollowRequest
                        ? t("profile.requested", "Requested")
                        : following
                          ? t("profile.following")
                          : t("profile.follow")}
                    </Text>
                  </Pressable>
                  {user.followsMe ? (
                    <Pressable
                      style={styles.messageButton}
                      onPress={handleMessage}
                      accessibilityLabel={t("profile.message")}
                      accessibilityRole="button"
                    >
                      <MaterialIcons
                        name="mail-outline"
                        size={HEADER.iconSize}
                        color={HEADER.iconColor}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
            <View
              style={[
                styles.privateProfileGate,
                styles.privateProfileGateFill,
                styles.privateProfileGateNoBorder,
              ]}
            >
              <View style={styles.privateProfileIconWrap}>
                <MaterialIcons name="lock" size={32} color={COLORS.tertiary} />
              </View>
              <Text style={styles.privateProfileTitle}>
                {t("profile.privateProfile", "Private profile")}
              </Text>
              <Text style={styles.privateProfileSubtext}>
                {t(
                  "profile.privateProfileHint",
                  "Follow this account to see their posts, replies, and quotes.",
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
        <ConfirmModal
          visible={blockConfirmVisible}
          title={t("safety.blockUser", "Block User")}
          message={t(
            "safety.blockConfirm",
            `Are you sure you want to block @${user?.handle ?? ""}? You won't see their posts or messages.`,
          )}
          confirmLabel={t("safety.block", "Block")}
          cancelLabel={t("common.cancel")}
          destructive
          icon="warning"
          onConfirm={confirmBlock}
          onCancel={() => setBlockConfirmVisible(false)}
        />
        <ConfirmModal
          visible={muteConfirmVisible}
          title={t("safety.muteUser", "Mute User")}
          message={t(
            "safety.muteConfirm",
            `Are you sure you want to mute @${user?.handle ?? ""}? You won't see their posts in your feed.`,
          )}
          confirmLabel={t("safety.mute", "Mute")}
          cancelLabel={t("common.cancel")}
          icon="volume-off"
          onConfirm={confirmMute}
          onCancel={() => setMuteConfirmVisible(false)}
        />
        <OptionsActionSheet
          visible={optionsModalVisible}
          title={t("profile.options", "Options for @" + (user?.handle ?? ""))}
          cancelLabel={t("common.cancel")}
          options={[
            {
              label: t("safety.mute", "Mute User"),
              onPress: handleMute,
              icon: "volume-off",
            },
            {
              label: t("safety.block", "Block User"),
              onPress: handleBlock,
              destructive: true,
              icon: "block",
            },
            {
              label: t("safety.report", "Report User"),
              onPress: () => openReportModal(user.id, "USER"),
              destructive: true,
              icon: "flag",
            },
            {
              label: t("profile.shareProfile", "Share profile"),
              onPress: handleShareProfile,
              icon: "share",
            },
            {
              label: t("profile.rssFeed", "RSS Feed"),
              onPress: handleOpenRssFeed,
              icon: "rss-feed",
            },
          ]}
          onCancel={() => setOptionsModalVisible(false)}
        />
        <ReportModal
          visible={reportModalVisible}
          targetType={reportTargetType}
          onClose={() => {
            setReportModalVisible(false);
            setReportTargetId(null);
          }}
          onReport={handleReportSubmit}
          title={t("safety.reportTitle", "Report")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={activeTab}
        style={styles.list}
        contentInset={Platform.OS === "ios" ? { top: insets.top } : undefined}
        contentOffset={
          Platform.OS === "ios" ? { x: 0, y: -insets.top } : undefined
        }
        contentContainerStyle={[
          { paddingBottom: bottomPadding },
          (activeTab === "replies"
            ? (posts as any[]).filter((r: any) => r?.post)
            : (posts as any[]).filter((p: any) => !!p?.author)
          ).length === 0 && { flexGrow: 1 },
        ]}
        {...LIST_SCROLL_DEFAULTS}
        data={
          activeTab === "replies"
            ? (posts as any[]).filter((r: any) => r?.post)
            : (posts as any[]).filter((p: any) => !!p?.author)
        }
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) =>
          activeTab === "replies" ? (
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.replyRow,
                pressed && styles.replyRowPressed,
              ]}
              onPress={() =>
                item.post?.id && router.push(`/post/${item.post.id}/comments`)
              }
            >
              <View style={styles.replyBodyWrap}>
                <MarkdownText>{item.body}</MarkdownText>
              </View>
              {item.post && (
                <View style={styles.replyToWrap}>
                  <Text style={styles.replyToLabel} numberOfLines={1}>
                    {item.post.title
                      ? `In reply to: ${item.post.title}`
                      : t("profile.inReplyToPost", "Reply to post")}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : (
            <PostItem
              post={activeTab === "saved" ? { ...item, isKept: true } : item}
              onKeep={
                activeTab === "saved" && isOwnProfile
                  ? () =>
                      setPosts((prev) =>
                        prev.filter((p: any) => p.id !== item.id),
                      )
                  : undefined
              }
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.profileListHeader}>
            <View
              style={[
                styles.profileHeaderContainer,
                user.isProtected &&
                  !following &&
                  styles.profileHeaderContainerBorder,
                { paddingTop: Platform.OS === "ios" ? 0 : insets.top },
              ]}
            >
              <View style={styles.headerBar}>
                <HeaderIconButton
                  onPress={() => router.back()}
                  icon="arrow-back"
                  accessibilityLabel="Go back"
                />
                <HeaderIconButton
                  onPress={() => handleUserMenu()}
                  icon="more-horiz"
                  accessibilityLabel="More options"
                />
              </View>

              <View style={styles.profileHeaderContent}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {getAvatarUri(user) ? (
                      <Image
                        source={{ uri: getAvatarUri(user)! }}
                        style={styles.avatarImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {user.displayName?.charAt(0) ||
                          user.handle?.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.identityBlock}>
                  <Text style={styles.name}>{user.displayName}</Text>
                  <Text style={styles.handle}>@{user.handle}</Text>
                </View>

                {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

                <View style={styles.actions}>
                  <Pressable
                    style={[
                      styles.actionButtonOutline,
                      (following || hasPendingFollowRequest) &&
                        styles.actionButtonActive,
                    ]}
                    onPress={handleFollow}
                    accessibilityLabel={
                      hasPendingFollowRequest
                        ? t("profile.requested", "Requested")
                        : following
                          ? t("profile.following")
                          : t("profile.follow")
                    }
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        (following || hasPendingFollowRequest) &&
                          styles.actionButtonTextActive,
                      ]}
                    >
                      {hasPendingFollowRequest
                        ? t("profile.requested", "Requested")
                        : following
                          ? t("profile.following")
                          : t("profile.follow")}
                    </Text>
                  </Pressable>

                  {user.followsMe ? (
                    <Pressable
                      style={styles.messageButton}
                      onPress={handleMessage}
                      accessibilityLabel={t("profile.message")}
                      accessibilityRole="button"
                    >
                      <MaterialIcons
                        name="mail-outline"
                        size={HEADER.iconSize}
                        color={HEADER.iconColor}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {!(user.isProtected && !following) ? (
                  <View style={styles.followersFollowingRow}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/user/connections",
                          params: { tab: "followers", handle: user.handle },
                        })
                      }
                      style={({ pressed }: { pressed: boolean }) =>
                        pressed && styles.followersFollowingPressable
                      }
                    >
                      <Text style={styles.followersFollowingText}>
                        {formatCompactNumber(user.followerCount)}{" "}
                        {t("profile.followers").toLowerCase()}
                      </Text>
                    </Pressable>
                    <Text style={styles.followersFollowingText}> · </Text>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/user/connections",
                          params: { tab: "following", handle: user.handle },
                        })
                      }
                      style={({ pressed }: { pressed: boolean }) =>
                        pressed && styles.followersFollowingPressable
                      }
                    >
                      <Text style={styles.followersFollowingText}>
                        {formatCompactNumber(user.followingCount)}{" "}
                        {t("profile.following").toLowerCase()}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>

            {user.isProtected && !following ? (
              <View
                style={[
                  styles.privateProfileGate,
                  styles.privateProfileGateFill,
                  styles.privateProfileGateNoBorder,
                  { minHeight: Math.max(200, screenHeight - 320) },
                ]}
              >
                <View style={styles.privateProfileIconWrap}>
                  <MaterialIcons
                    name="lock"
                    size={32}
                    color={COLORS.tertiary}
                  />
                </View>
                <Text style={styles.privateProfileTitle}>
                  {t("profile.privateProfile", "Private profile")}
                </Text>
                <Text style={styles.privateProfileSubtext}>
                  {t(
                    "profile.privateProfileHint",
                    "Follow this account to see their posts, replies, and quotes.",
                  )}
                </Text>
              </View>
            ) : (
              <View style={[styles.tabsContainer, TABS.container]}>
                <ScrollView
                  horizontal
                  {...LIST_SCROLL_DEFAULTS}
                  contentContainerStyle={[styles.tabsContent, TABS.content]}
                  style={[styles.tabsScrollView, TABS.scrollView]}
                >
                  {(isOwnProfile
                    ? ([
                        "posts",
                        "replies",
                        "quotes",
                        "cited",
                        "saved",
                        "collections",
                      ] as const)
                    : (["posts", "quotes", "cited", "collections"] as const)
                  ).map((tab) => {
                    const count =
                      tab === "posts"
                        ? (user.postCount ?? 0)
                        : tab === "replies"
                          ? (user.replyCount ?? 0)
                          : tab === "quotes"
                            ? (user.quoteReceivedCount ?? 0)
                            : tab === "saved"
                              ? (user.keepsCount ?? 0)
                              : tab === "cited"
                                ? (user.citedCount ?? 0)
                                : (user.collectionCount ?? 0);
                    return (
                      <Pressable
                        key={tab}
                        style={[
                          styles.tab,
                          TABS.tab,
                          activeTab === tab && TABS.tabActive,
                        ]}
                        onPress={() => handleTabChange(tab)}
                        accessibilityLabel={
                          count != null && count > 0
                            ? `${t(`profile.${tab}`)} ${count}`
                            : t(`profile.${tab}`)
                        }
                        accessibilityRole="tab"
                        accessibilityState={{ selected: activeTab === tab }}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            TABS.tabText,
                            activeTab === tab && TABS.tabTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {t(`profile.${tab}`)}
                          {count != null && count > 0
                            ? ` (${formatCompactNumber(count)})`
                            : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={emptyStateCenterWrapStyle}>
            {loading && posts.length === 0 ? (
              <FeedSkeleton count={3} />
            ) : (
              <EmptyState
                icon={
                  activeTab === "saved"
                    ? "bookmark-outline"
                    : activeTab === "collections"
                      ? "folder-open"
                      : activeTab === "replies"
                        ? "chat-bubble-outline"
                        : activeTab === "quotes"
                          ? "format-quote"
                          : activeTab === "cited"
                            ? "link"
                            : "article"
                }
                headline={
                  activeTab === "saved"
                    ? t("profile.noSaved", "No saved posts")
                    : activeTab === "collections"
                      ? t("profile.noCollections", "No public collections")
                      : activeTab === "replies"
                        ? t("profile.noReplies", "No replies yet")
                        : activeTab === "quotes"
                          ? t("profile.noQuotes", "No quotes yet")
                          : activeTab === "cited"
                            ? t("profile.noCited", "No cited posts")
                            : t("profile.noPosts", "No posts yet")
                }
                subtext={
                  activeTab === "saved"
                    ? t(
                        "profile.noSavedHint",
                        "Bookmark posts from the reading view to see them here.",
                      )
                    : activeTab === "collections"
                      ? t(
                          "profile.noCollectionsHint",
                          "Public collections will appear here.",
                        )
                      : activeTab === "replies"
                        ? t("profile.noRepliesHint", "Replies will show here.")
                        : activeTab === "quotes"
                          ? t("profile.noQuotesHint", "Quotes will show here.")
                          : activeTab === "cited"
                            ? t(
                                "profile.noCitedHint",
                                "Posts this user has cited appear here.",
                              )
                            : t(
                                "profile.noPostsHintView",
                                "Posts will appear here.",
                              )
                }
              />
            )}
          </View>
        }
        ListFooterComponent={
          <ListFooterLoader visible={!!(hasMore && loadingMore)} />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile(1, true);
            }}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        {...FLATLIST_DEFAULTS}
      />

      <ConfirmModal
        visible={blockConfirmVisible}
        title={t("safety.blockUser", "Block User")}
        message={t(
          "safety.blockConfirm",
          `Are you sure you want to block @${user?.handle ?? ""}? You won't see their posts or messages.`,
        )}
        confirmLabel={t("safety.block", "Block")}
        cancelLabel={t("common.cancel")}
        destructive
        icon="warning"
        onConfirm={confirmBlock}
        onCancel={() => setBlockConfirmVisible(false)}
      />
      <ConfirmModal
        visible={muteConfirmVisible}
        title={t("safety.muteUser", "Mute User")}
        message={t(
          "safety.muteConfirm",
          `Are you sure you want to mute @${user?.handle ?? ""}? You won't see their posts in your feed.`,
        )}
        confirmLabel={t("safety.mute", "Mute")}
        cancelLabel={t("common.cancel")}
        icon="volume-off"
        onConfirm={confirmMute}
        onCancel={() => setMuteConfirmVisible(false)}
      />
      <OptionsActionSheet
        visible={optionsModalVisible}
        title={t("profile.options", "Options for @" + (user?.handle ?? ""))}
        cancelLabel={t("common.cancel")}
        options={[
          {
            label: t("safety.mute", "Mute User"),
            onPress: handleMute,
            icon: "volume-off",
          },
          {
            label: t("safety.block", "Block User"),
            onPress: handleBlock,
            destructive: true,
            icon: "block",
          },
          {
            label: t("safety.report", "Report User"),
            onPress: () => openReportModal(user.id, "USER"),
            destructive: true,
            icon: "flag",
          },
          {
            label: t("profile.shareProfile", "Share profile"),
            onPress: handleShareProfile,
            icon: "share",
          },
          {
            label: t("profile.rssFeed", "RSS Feed"),
            onPress: handleOpenRssFeed,
            icon: "rss-feed",
          },
        ]}
        onCancel={() => setOptionsModalVisible(false)}
      />
      <ReportModal
        visible={reportModalVisible}
        targetType={reportTargetType}
        onClose={() => {
          setReportModalVisible(false);
          setReportTargetId(null);
        }}
        onReport={handleReportSubmit}
        title={t("safety.reportTitle", "Report")}
      />
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HEADER.barPaddingHorizontal as DimensionValue,
    paddingBottom: HEADER.barPaddingBottom as DimensionValue,
  },
  blockedHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HEADER.barPaddingHorizontal as DimensionValue,
    paddingBottom: HEADER.barPaddingBottom as DimensionValue,
    backgroundColor: COLORS.ink,
  },
  privateProfileScrollContent: {
    flexGrow: 1,
  },
  profileListHeader: {
    width: "100%",
    backgroundColor: COLORS.ink,
  },
  profileHeaderContainer: {
    width: "100%",
    backgroundColor: COLORS.ink,
    paddingBottom: SPACING.l,
  },
  /** Border below header (where tab bar would be) for private profile so divider sits above the gate, not under it */
  profileHeaderContainerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  profileHeaderContent: {
    alignItems: "center",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    gap: SPACING.l,
  },
  list: {
    flex: 1,
  },
  tabLoadingWrap: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center",
    gap: SPACING.m,
  },
  tabLoadingText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  replyRow: {
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  replyRowPressed: { opacity: 0.8 },
  replyBodyWrap: { marginBottom: SPACING.xs },
  replyBody: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
    lineHeight: 22,
  },
  replyToWrap: { flexDirection: "row", alignItems: "center" },
  replyToLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 120,
    height: 120,
    marginBottom: SPACING.xs,
  },
  avatar: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.divider,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  identityBlock: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 24, // text-2xl
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  handle: {
    fontSize: 14, // text-sm
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  bio: {
    fontSize: 15,
    color: COLORS.paper,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: FONTS.regular,
    opacity: 0.9,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  actionButtonOutline: {
    height: 38,
    minWidth: 120,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xs,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonTextActive: {
    color: COLORS.paper,
  },
  messageButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.2,
  },
  followersFollowingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  followersFollowingPressable: {
    opacity: 0.7,
  },
  followersFollowingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xxxl,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 0,
  },
  statsRowContent: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: "absolute",
    top: -12,
    right: -12,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
    opacity: 0.95,
  },
  tabsScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    gap: SPACING.m,
    paddingRight: SPACING.l,
  },
  tab: {
    flexShrink: 0,
    alignItems: "center",
  },
  tabText: {},
  privateProfileGate: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  /** When used with gate fill (private profile), border is on header above; no border under the indicator */
  privateProfileGateNoBorder: {
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
  },
  privateProfileGateFill: {
    flex: 1,
  },
  privateProfileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
  },
  privateProfileTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  privateProfileSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginTop: 50,
    fontFamily: FONTS.medium,
  },
  blockedStateContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  blockedStateIcon: {
    marginBottom: SPACING.l,
  },
  blockedStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: "center",
    marginBottom: SPACING.s,
  },
  blockedStateSubtext: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  blockedStateUnblockBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
  },
  blockedStateUnblockBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: "center",
  },
});
