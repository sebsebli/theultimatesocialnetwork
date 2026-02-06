import React, { useEffect, useState, useCallback } from "react";
import { Text, View, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../../constants/theme";
import { CenteredEmptyState } from "../../components/EmptyState";
import { UserCardSkeleton } from "../../components/LoadingSkeleton";

export default function MutedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const [muted, setMuted] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unmuteTarget, setUnmuteTarget] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  const loadMuted = async () => {
    try {
      const data = await api.get("/safety/muted");
      setMuted(Array.isArray(data) ? data : []);
    } catch (error) {
      if (__DEV__) console.error("Failed to load muted users", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMuted();
  }, []);

  const handleUnmute = (userId: string, displayName: string) =>
    setUnmuteTarget({ id: userId, displayName });

  const confirmUnmute = async () => {
    if (!unmuteTarget) return;
    try {
      await api.delete(`/safety/mute/${unmuteTarget.id}`);
      setMuted((prev) => prev.filter((u) => u.id !== unmuteTarget.id));
      showSuccess(t("safety.unmutedMessage", "This user has been unmuted."));
    } catch (error) {
      if (__DEV__) console.error("Failed to unmute user", error);
      showError(t("safety.failedUnmute", "Failed to unmute user."));
      throw error;
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <View style={styles.userItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.displayName as string | undefined)?.charAt(0) ||
              (item.handle as string | undefined)?.charAt(0).toUpperCase() ||
              "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>
            {(item.displayName || item.handle) as string}
          </Text>
          <Text style={styles.handle}>@{item.handle as string}</Text>
        </View>
        <Pressable
          style={styles.unmuteButton}
          onPress={() => handleUnmute(item.id as string, (item.displayName || item.handle) as string)}
          accessibilityLabel={t("safety.unmute", "Unmute")}
          accessibilityRole="button"
        >
          <Text style={styles.unmuteButtonText}>
            {t("safety.unmute", "Unmute")}
          </Text>
        </Pressable>
      </View>
    ),
    [],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMuted();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={t("settings.mutedAccounts", "Muted Accounts")}
          paddingTop={insets.top}
        />
        <View style={styles.loadingContainer}>
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("settings.mutedAccounts", "Muted Accounts")}
        paddingTop={insets.top}
      />

      <FlatList
        data={muted}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: Record<string, unknown>) => item.id as string}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <CenteredEmptyState
            icon="notifications-off"
            headline={t("safety.noMuted", "No muted users")}
            subtext={t(
              "safety.noMutedHint",
              "Muted accounts will appear here.",
            )}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          muted.length === 0 && { flexGrow: 1 },
        ]}
        {...FLATLIST_DEFAULTS}
      />

      <ConfirmModal
        visible={!!unmuteTarget}
        title={t("safety.unmuteUser", "Unmute User")}
        message={
          unmuteTarget
            ? t(
                "safety.unmuteConfirm",
                `Are you sure you want to unmute ${unmuteTarget.displayName}?`,
              )
            : ""
        }
        confirmLabel={t("safety.unmute", "Unmute")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmUnmute}
        onCancel={() => setUnmuteTarget(null)}
      />
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: SPACING.l,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.hover,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  handle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  unmuteButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },
  unmuteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});
