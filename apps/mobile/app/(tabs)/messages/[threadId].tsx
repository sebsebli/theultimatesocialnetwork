import React, { useState, useEffect, useRef } from 'react';
import { Text, View, FlatList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../../../utils/api';
import { useSocket } from '../../../context/SocketContext';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { CenteredEmptyState } from '../../../components/EmptyState';

export default function ChatScreen() {
  const { threadId, initialMessage } = useLocalSearchParams<{ threadId: string; initialMessage?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { on, off } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    api.get('/users/me').then(u => setCurrentUserId(u.id)).catch(() => { });
  }, []);

  useEffect(() => {
    if (initialMessage && typeof initialMessage === 'string') {
      setInputText(initialMessage);
    }
  }, [initialMessage]);

  const loadMessages = async () => {
    try {
      const data = await api.get(`/messages/threads/${threadId}/messages`);
      setMessages(Array.isArray(data) ? data.reverse() : []); // Oldest first for chat usually? FlatList inverted
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [threadId]);

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      if (msg.threadId === threadId) {
        setMessages(prev => [msg, ...prev]);
      }
    };
    on('message', handleNewMessage);
    return () => off('message', handleNewMessage);
  }, [threadId, on, off]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const msg = await api.post(`/messages/threads/${threadId}/messages`, { body: text });
      setMessages(prev => [msg, ...prev]);
    } catch (error) {
      console.error('Failed to send', error);
      setInputText(text); // Revert
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.authorId === currentUserId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.body}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('inbox.chat', 'Chat')} paddingTop={insets.top} />

      <FlatList
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item: { id: string }) => item.id}
        inverted
        contentContainerStyle={[styles.listContent, messages.length === 0 && { flexGrow: 1 }]}
        ListEmptyComponent={!loading ? <CenteredEmptyState icon="chat-bubble-outline" headline={t('messages.noMessagesYet', 'No messages yet')} compact /> : null}
        {...FLATLIST_DEFAULTS}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, SPACING.m) }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('messages.typeMessage', 'Type a message...')}
            placeholderTextColor={COLORS.tertiary}
            multiline
          />
          <Pressable onPress={handleSend} disabled={!inputText.trim() || sending} style={styles.sendButton}>
            <MaterialIcons name="send" size={HEADER.iconSize} color={inputText.trim() ? COLORS.primary : COLORS.tertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: '80%',
    padding: SPACING.m,
    borderRadius: 16,
    marginBottom: SPACING.s,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.hover,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16, fontFamily: FONTS.regular },
  myMessageText: { color: '#FFF' },
  theirMessageText: { color: COLORS.paper },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
