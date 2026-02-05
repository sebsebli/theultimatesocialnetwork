import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../utils/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { HeaderIconButton } from "../components/HeaderIconButton";
import { CollectionCard } from "../components/CollectionCard";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../components/EmptyState";
import { SettingsRowSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../context/ToastContext";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
  SEARCH_BAR,
} from "../constants/theme";

interface Collection {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
  isPublic?: boolean;
  previewImageKey?: string | null;
}

export default function CollectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);

  const filteredCollections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((c) => {
      if (filter === "public" && !c.isPublic) return false;
      if (filter === "private" && c.isPublic) return false;
      if (!q) return true;
      const title = (c.title ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [collections, search, filter]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await api.get("/collections");
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load collections", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollections();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Collection }) => (
      <CollectionCard
        item={{
          id: item.id,
          title: item.title,
          description: item.description,
          itemCount: item.itemCount,
          previewImageKey: item.previewImageKey,
          recentPost: (item as any).recentPost ?? undefined,
        }}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/collections/${item.id}`);
        }}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Collection) => item.id, []);

  const createCollection = async () => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post("/collections", {
        title: newTitle.trim(),
        isPublic: newIsPublic,
      });
      setModalVisible(false);
      setNewTitle("");
      setNewIsPublic(true);
      loadCollections();
    } catch (error) {
      console.error("Failed to create collection", error);
      showError(t("collections.failedCreate"));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("collections.title")}
        paddingTop={insets.top}
        right={
          <HeaderIconButton
            onPress={() => setModalVisible(true)}
            icon="add"
            accessibilityLabel={t("collections.create")}
          />
        }
      />

      <View style={styles.filters}>
        <View style={SEARCH_BAR.container}>
          <MaterialIcons
            name="search"
            size={HEADER.iconSize}
            color={COLORS.tertiary}
          />
          <TextInput
            style={SEARCH_BAR.input}
            placeholder={t(
              "collections.searchPlaceholder",
              "Search collections...",
            )}
            placeholderTextColor={COLORS.tertiary}
            value={search}
            onChangeText={setSearch}
            includeFontPadding={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filterPills}>
          <Pressable
            style={[
              styles.filterPill,
              filter === "all" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "all" && styles.filterPillTextActive,
              ]}
            >
              {t("collections.filterAll", "All")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              filter === "public" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("public")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "public" && styles.filterPillTextActive,
              ]}
            >
              {t("collections.filterPublic", "Public")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              filter === "private" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("private")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "private" && styles.filterPillTextActive,
              ]}
            >
              {t("collections.filterPrivate", "Private")}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredCollections}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={emptyStateCenterWrapStyle}>
            {loading ? (
              <View style={styles.skeletonList}>
                <SettingsRowSkeleton />
                <SettingsRowSkeleton />
                <SettingsRowSkeleton />
                <SettingsRowSkeleton />
              </View>
            ) : (
              <EmptyState
                icon="folder-open"
                headline={t("collections.empty")}
                subtext={t(
                  "collections.emptyHint",
                  "Create a collection to organize your saved posts.",
                )}
                actionLabel={t("collections.create")}
                onAction={() => setModalVisible(true)}
              />
            )}
          </View>
        }
        contentContainerStyle={
          filteredCollections.length === 0
            ? { flexGrow: 1 }
            : { paddingBottom: SPACING.xxxl }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        {...FLATLIST_DEFAULTS}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + SPACING.l },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>
              {t("collections.newTitle", "New Collection")}
            </Text>
            <TextInput
              style={styles.createInput}
              placeholder={t("collections.titlePlaceholder", "Collection name")}
              placeholderTextColor={COLORS.tertiary}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <View style={styles.visibilityRow}>
              <View style={styles.visibilityLabel}>
                <Text style={styles.visibilityTitle}>
                  {t("collections.visibility", "Visibility")}
                </Text>
                <Text style={styles.visibilityHint}>
                  {newIsPublic
                    ? t(
                        "collections.visibilityPublic",
                        "Public — anyone can see this collection",
                      )
                    : t(
                        "collections.visibilityPrivate",
                        "Private — only your followers can see it",
                      )}
                </Text>
              </View>
              <Switch
                value={newIsPublic}
                onValueChange={setNewIsPublic}
                trackColor={{
                  false: COLORS.tertiary + "40",
                  true: COLORS.primary + "99",
                }}
                thumbColor={newIsPublic ? COLORS.primary : COLORS.secondary}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButtonCreate,
                  !newTitle.trim() && styles.modalButtonCreateDisabled,
                ]}
                onPress={createCollection}
                disabled={!newTitle.trim()}
              >
                <Text style={styles.modalButtonTextCreate}>
                  {t("common.create")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  filters: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  filterPills: {
    flexDirection: "row",
    gap: SPACING.s,
  },
  filterPill: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  skeletonList: {
    paddingVertical: SPACING.s,
  },
  loadingText: {
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.m,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
    alignSelf: "center",
    marginBottom: SPACING.l,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  createInput: {
    minHeight: 48,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.l,
    paddingVertical: SPACING.s,
  },
  visibilityLabel: {
    flex: 1,
    marginRight: SPACING.m,
  },
  visibilityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  visibilityHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  privacyLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  privacyRow: {
    flexDirection: "row",
    gap: SPACING.s,
    marginBottom: SPACING.l,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: "center",
  },
  privacyOptionActive: {
    backgroundColor: "rgba(110, 122, 138, 0.2)",
    borderColor: COLORS.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  privacyOptionTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  modalActions: {
    flexDirection: "row",
    gap: SPACING.m,
  },
  modalButtonCancel: {
    flex: 1,
    minHeight: 44,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalButtonCreate: {
    flex: 1,
    minHeight: 44,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCreateDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    color: COLORS.paper,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  modalButtonTextCreate: {
    color: COLORS.ink,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
});
