/**
 * PostActionContext — shared modal provider for post actions.
 *
 * Instead of every PostItem rendering its own AddToCollectionSheet, ShareSheet,
 * ConfirmModal (×2) and OptionsActionSheet (= 5 modals per feed item, ~200 in a
 * 40-item feed), this provider renders them **once** and exposes imperative
 * methods so any PostItem can trigger them.
 */
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { api } from "../utils/api";
import { queueAction } from "../utils/offlineQueue";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useToast } from "./ToastContext";
import { useAuth } from "./auth";
import AddToCollectionSheet, {
  type AddToCollectionSheetRef,
} from "../components/AddToCollectionSheet";
import ShareSheet, { type ShareSheetRef } from "../components/ShareSheet";
import { ConfirmModal } from "../components/ConfirmModal";
import { OptionsActionSheet } from "../components/OptionsActionSheet";

import type { Post } from "../types";

interface PostActionMethods {
  /** Open the share sheet for a post */
  openShare: (postId: string, opts?: { authorIsProtected?: boolean }) => void;
  /** Open the add-to-collection sheet */
  openCollection: (postId: string) => void;
  /** Open the options action sheet (report / delete) */
  openOptions: (post: Post, callbacks?: { onDeleted?: () => void }) => void;
}

const PostActionContext = createContext<PostActionMethods | null>(null);

export function usePostActions(): PostActionMethods {
  const ctx = useContext(PostActionContext);
  if (!ctx) {
    throw new Error("usePostActions must be used within a PostActionProvider");
  }
  return ctx;
}

export function PostActionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { t } = useTranslation();
  const { isOffline } = useNetworkStatus();
  const { showSuccess, showError } = useToast();
  const { userId } = useAuth();

  // Refs for imperative sheets
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);
  const shareSheetRef = useRef<ShareSheetRef>(null);

  // State for options / report / delete modals
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  // Current post being acted on
  const activePostRef = useRef<Post | null>(null);
  const callbacksRef = useRef<{ onDeleted?: () => void }>({});

  // ── Exposed methods ──────────────────────────────────────────────────

  const openShare = useCallback(
    (postId: string, opts?: { authorIsProtected?: boolean }) => {
      Haptics.selectionAsync();
      shareSheetRef.current?.open(postId, opts);
    },
    [],
  );

  const openCollection = useCallback((postId: string) => {
    collectionSheetRef.current?.open(postId);
  }, []);

  const openOptions = useCallback(
    (post: Post, callbacks?: { onDeleted?: () => void }) => {
      Haptics.selectionAsync();
      activePostRef.current = post;
      callbacksRef.current = callbacks ?? {};
      if (Platform.OS === "web") {
        const result = window.confirm(
          t("post.reportMessage", "Are you sure you want to report this post?"),
        );
        if (result) setReportVisible(true);
      } else {
        setOptionsVisible(true);
      }
    },
    [t],
  );

  // ── Internal handlers ────────────────────────────────────────────────

  const handleDeletePost = useCallback(async () => {
    const post = activePostRef.current;
    if (!post) return;
    try {
      await api.delete(`/posts/${post.id}`);
      showSuccess(t("post.deleted", "Post deleted"));
      setDeleteVisible(false);
      setOptionsVisible(false);
      callbacksRef.current.onDeleted?.();
    } catch {
      showError(t("post.deleteFailed", "Failed to delete post"));
    }
  }, [showSuccess, showError, t]);

  const handleReport = useCallback(async () => {
    const post = activePostRef.current;
    if (!post) return;
    try {
      if (isOffline) {
        await queueAction({
          type: "report",
          endpoint: `/safety/report`,
          method: "POST",
          data: {
            targetId: post.id,
            targetType: "POST",
            reason: "Reported via mobile app",
          },
        });
      } else {
        await api.post(`/safety/report`, {
          targetId: post.id,
          targetType: "POST",
          reason: "Reported via mobile app",
        });
      }
      showSuccess(t("post.reportSuccess", "Post reported successfully"));
    } catch {
      showError(t("post.reportError", "Failed to report post"));
    }
  }, [isOffline, showSuccess, showError, t]);

  const isOwnPost = !!userId && activePostRef.current?.author?.id === userId;

  const optionsItems = useMemo(
    () => [
      ...(isOwnPost
        ? [
            {
              label: t("post.delete", "Delete Post"),
              onPress: () => {
                setOptionsVisible(false);
                setDeleteVisible(true);
              },
              destructive: true as const,
              icon: "delete-outline" as const,
            },
          ]
        : []),
      {
        label: t("post.report", "Report Post"),
        onPress: () => {
          setOptionsVisible(false);
          setReportVisible(true);
        },
        destructive: true,
        icon: "flag",
      },
    ],
    [isOwnPost, t],
  );

  const value = useMemo<PostActionMethods>(
    () => ({ openShare, openCollection, openOptions }),
    [openShare, openCollection, openOptions],
  );

  const modals = (
    <>
      <AddToCollectionSheet ref={collectionSheetRef} />
      <ShareSheet ref={shareSheetRef} />

      <OptionsActionSheet
        visible={optionsVisible}
        title={t("post.options", "Post Options")}
        options={optionsItems}
        cancelLabel={t("common.cancel")}
        onCancel={() => setOptionsVisible(false)}
      />

      <ConfirmModal
        visible={reportVisible}
        title={t("post.reportTitle", "Report Post")}
        message={t(
          "post.reportMessage",
          "Are you sure you want to report this post?",
        )}
        confirmLabel={t("post.report", "Report")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleReport}
        onCancel={() => setReportVisible(false)}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t("post.delete", "Delete Post")}
        message={t(
          "post.deleteConfirm",
          "Are you sure you want to delete this post? This cannot be undone.",
        )}
        confirmLabel={t("post.delete", "Delete Post")}
        cancelLabel={t("common.cancel")}
        destructive
        icon="warning"
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteVisible(false)}
      />
    </>
  );

  // @ts-expect-error React 19 JSX return type compatibility
  return (
    <PostActionContext.Provider value={value}>
      {children}
      {modals}
    </PostActionContext.Provider>
  );
}
