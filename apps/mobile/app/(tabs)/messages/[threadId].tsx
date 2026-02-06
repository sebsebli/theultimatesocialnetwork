import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { api } from "../../../utils/api";
import { useSocket } from "../../../context/SocketContext";
import { useToast } from "../../../context/ToastContext";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { HeaderIconButton } from "../../../components/HeaderIconButton";
import { CenteredEmptyState } from "../../../components/EmptyState";
import { MessageListSkeleton } from "../../../components/LoadingSkeleton";
import { OptionsActionSheet } from "../../../components/OptionsActionSheet";
import { ConfirmModal } from "../../../components/ConfirmModal";

export default function ChatScreen() {
  const { threadId, initialMessage } = useLocalSearchParams<{
    threadId: string;
    initialMessage?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { on, off } = useSocket();
  const { showError } = useToast();
  const [messages, setMessages] = useState<Array<{ id: string; body: string; senderId?: string; authorId?: string; createdAt?: string }>>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    api
      .get<{ id: string }>("/users/me")
      .then((u) => setCurrentUserId(u.id))
      .catch(() => { /* current user lookup best-effort */ });
  }, []);

  useEffect(() => {
    if (initialMessage && typeof initialMessage === "string") {
      setInputText(initialMessage);
    }
  }, [initialMessage]);

  const loadMessages = async (cancelledRef?: { current: boolean }) => {
    try {
      const data = await api.get(`/messages/threads/${threadId}/messages`);
      if (cancelledRef?.current) return;
      setMessages(Array.isArray(data) ? data.reverse() : []); // Oldest first for chat usually? FlatList inverted
    } catch (error) {
      if (cancelledRef?.current) return;
      if (__DEV__) console.error("Failed to load messages", error);
    } finally {
      if (!cancelledRef?.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const cancelledRef = { current: false };
    const load = async () => {
      await loadMessages(cancelledRef);
    };
    load();
    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [threadId]);

  useEffect(() => {
    const handleNewMessage = (data: unknown) => {
      const msg = data as { threadId?: string; id: string; body: string; senderId?: string; authorId?: string; createdAt?: string };
      if (msg.threadId === threadId) {
        setMessages((prev) => [msg, ...prev]);
      }
    };
    on("message", handleNewMessage);
    return () => off("message", handleNewMessage);
  }, [threadId, on, off]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      const msg = await api.post<{ id: string; body: string; senderId?: string; authorId?: string; createdAt?: string }>(`/messages/threads/${threadId}/messages`, {
        body: text,
      });
      setMessages((prev) => [msg, ...prev]);
    } catch (error) {
      if (__DEV__) console.error("Failed to send", error);
      setInputText(text); // Revert
    } finally {
      setSending(false);
    }
  };

  const handleMarkUnread = async () => {
    setOptionsVisible(false);
    try {
      await api.patch(`/messages/threads/${threadId}/read`, { read: false });
      router.back();
    } catch (e) {
      showError(t("messages.loadError", "Failed to update"));
    }
  };

  const handleDeleteConversation = async () => {
    setOptionsVisible(false);
    setDeleteConfirmVisible(false);
    try {
      await api.delete(`/messages/threads/${threadId}`);
      router.back();
    } catch (e) {
      showError(t("messages.deleteFailed", "Failed to delete conversation"));
    }
  };

  const renderItem = ({ item }: { item: { id: string; body: string; senderId?: string; authorId?: string } }) => {
    const isMe = (item.senderId ?? item.authorId) === currentUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMe ? styles.myMessageText : styles.theirMessageText,
          ]}
        >
          {item.body}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("inbox.chat", "Chat")}
        paddingTop={insets.top}
        right={
          <HeaderIconButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setOptionsVisible(true);
            }}
            icon="more-vert"
            accessibilityLabel={t("common.options", "Options")}
          />
        }
      />

      <FlatList
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item: { id: string }) => item.id}
        inverted
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && { flexGrow: 1 },
        ]}
        ListEmptyComponent={
          loading && messages.length === 0 ? (
            <MessageListSkeleton count={4} />
          ) : !loading ? (
            <CenteredEmptyState
              icon="chat-bubble-outline"
              headline={t("messages.noMessagesYet", "No messages yet")}
              compact
            />
          ) : null
        }
        {...FLATLIST_DEFAULTS}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, SPACING.m) },
          ]}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("messages.typeMessage", "Type a message...")}
            placeholderTextColor={COLORS.tertiary}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={styles.sendButton}
            accessibilityLabel={t("messages.send", "Send message")}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="send"
              size={HEADER.iconSize}
              color={inputText.trim() ? COLORS.primary : COLORS.tertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <OptionsActionSheet
        visible={optionsVisible}
        options={[
          {
            label: t("messages.markUnread", "Mark as unread"),
            onPress: handleMarkUnread,
            icon: "mark-email-unread",
          },
          {
            label: t("messages.deleteConversation", "Delete conversation"),
            onPress: () => {
              setOptionsVisible(false);
              setDeleteConfirmVisible(true);
            },
            destructive: true,
            icon: "delete",
          },
        ]}
        cancelLabel={t("common.cancel")}
        onCancel={() => setOptionsVisible(false)}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={t("messages.deleteConversation", "Delete conversation")}
        message={t(
          "messages.deleteConversationConfirm",
          "This will permanently delete the conversation for both participants.",
        )}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteConfirmVisible(false)}
        destructive
      />
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  listContent: { padding: SPACING.m },
  messageBubble: {
    maxWidth: "80%",
    padding: SPACING.m,
    borderRadius: 16,
    marginBottom: SPACING.s,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.hover,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16, fontFamily: FONTS.regular },
  myMessageText: { color: COLORS.paper },
  theirMessageText: { color: COLORS.paper },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.hover,
    borderRadius: 20,
    paddingHorizontal: SPACING.m,
    paddingVertical: 8, // Fixed heightish
    maxHeight: 100,
    color: COLORS.paper,
    fontSize: 16,
  },
  sendButton: { padding: SPACING.s, marginLeft: SPACING.s },
});
