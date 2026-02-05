import React, { useState, useEffect, useCallback } from "react";
import { Text, View, Pressable, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../../constants/theme";
import { ScreenHeader } from "../../components/ScreenHeader";
import { FullScreenSkeleton } from "../../components/LoadingSkeleton";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import { ConfirmModal } from "../../components/ConfirmModal";
import {
  getAllOfflinePosts,
  clearAllOfflinePosts,
  removeOfflinePost,
  getOfflineStorageInfo,
  type OfflinePost,
} from "../../utils/offlineStorage";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OfflineStorageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<OfflinePost[]>([]);
  const [info, setInfo] = useState({ count: 0, sizeBytes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removeOnePost, setRemoveOnePost] = useState<OfflinePost | null>(null);
  const [removeAllVisible, setRemoveAllVisible] = useState(false);

  const load = useCallback(async () => {
    const [list, storageInfo] = await Promise.all([
      getAllOfflinePosts(),
      getOfflineStorageInfo(),
    ]);
    setPosts(list);
    setInfo(storageInfo);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemoveOne = (post: OfflinePost) => setRemoveOnePost(post);

  const confirmRemoveOne = async () => {
    if (!removeOnePost) return;
    await removeOfflinePost(removeOnePost.id);
    await load();
  };

  const handleRemoveAll = () => setRemoveAllVisible(true);

  const confirmRemoveAll = async () => {
    await clearAllOfflinePosts();
    await load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={t("settings.manageOfflineStorage", "Manage offline storage")}
          paddingTop={0}
        />
        <FullScreenSkeleton />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title={t("settings.manageOfflineStorage", "Manage offline storage")}
        paddingTop={0}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {t(
            "settings.offlineStorageSummary",
            "{{count}} articles · {{size}}",
            {
              count: info.count,
              size: formatSize(info.sizeBytes),
            },
          )}
        </Text>
        {info.count > 0 && (
          <Pressable style={styles.removeAllBtn} onPress={handleRemoveAll}>
            <Text style={styles.removeAllText}>
              {t("settings.removeAllOffline", "Remove all")}
            </Text>
          </Pressable>
        )}
      </View>

      {posts.length === 0 ? (
        <View style={emptyStateCenterWrapStyle}>
          <EmptyState
            icon="offline-pin"
            headline={t("settings.noOfflineArticles", "No offline articles")}
            subtext={t(
              "settings.noOfflineHint",
              "Download articles from the reading screen to read offline.",
            )}
          />
        </View>
      ) : (
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }: { item: OfflinePost }) => (
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title || item.body?.slice(0, 60) || item.id}
                </Text>
                {item.author?.displayName && (
                  <Text style={styles.rowAuthor}>
                    {item.author.displayName}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => handleRemoveOne(item)}
                style={styles.removeBtn}
                accessibilityLabel={t("common.remove", "Remove")}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={HEADER.iconSize}
                  color={COLORS.error}
                />
              </Pressable>
            </View>
          )}
          {...FLATLIST_DEFAULTS}
        />
      )}

      <ConfirmModal
        visible={!!removeOnePost}
        title={t("settings.removeDownload", "Remove download")}
        message={
          removeOnePost
            ? t(
                "settings.removeDownloadConfirm",
                'Remove "{{title}}" from this device?',
                {
                  title: (
                    removeOnePost.title ||
                    removeOnePost.body?.slice(0, 30) ||
                    removeOnePost.id
                  ).slice(0, 50),
                },
              )
            : ""
        }
        confirmLabel={t("common.remove", "Remove")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmRemoveOne}
        onCancel={() => setRemoveOnePost(null)}
      />
      <ConfirmModal
        visible={removeAllVisible}
        title={t("settings.removeAllOffline", "Remove all offline articles")}
        message={t(
          "settings.removeAllOfflineConfirm",
          "This will free storage. You can download articles again when online.",
        )}
        confirmLabel={t("common.remove", "Remove all")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmRemoveAll}
        onCancel={() => setRemoveAllVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.ink,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  removeAllBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  removeAllText: {
    fontSize: 14,
    color: COLORS.error,
    fontFamily: FONTS.semiBold,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  rowAuthor: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  removeBtn: {
    padding: SPACING.s,
  },
});
