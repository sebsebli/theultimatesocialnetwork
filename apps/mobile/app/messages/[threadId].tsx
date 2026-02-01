import React, { useState, useEffect, useRef } from 'react';
import { Text, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS, createStyles } from '../../constants/theme';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function MessageThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { threadId } = useLocalSearchParams();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setTextInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    api.get('/users/me').then(setCurrentUser).catch(() => { });
  }, []);

  useEffect(() => {
    if (threadId) loadMessages();
  }, [threadId]);

  const loadMessages = async () => {
    try {
      const data = await api.get(`/messages/threads/${threadId}/messages`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const tempId = Date.now().toString();
    const optimisticMessage = {
      id: tempId,
      body: inputText,
      senderId: 'me',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTextInput('');
    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const saved = await api.post(`/messages/threads/${threadId}/messages`, { body: optimisticMessage.body });
      // Replace optimistic message with saved one
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setTextInput(optimisticMessage.body); // Restore text
      alert(t('messages.failedSend', 'Failed to send message'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenHeader title={t('inbox.messages')} paddingTop={insets.top} />

      <FlatList
        ref={flatListRef}
        data={messages}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => {
          const isMe = item.senderId === 'me' || (currentUser && item.senderId === currentUser.id);

          return (
            <View style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.theirMessage
            ]}>
              <Text style={styles.messageText}>{item.body}</Text>
              <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('messages.typeMessage')}
          placeholderTextColor={COLORS.tertiary}
          value={inputText}
          onChangeText={setTextInput}
          multiline
          accessibilityLabel={t('messages.typeMessage')}
        />
        <Pressable
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
          accessibilityLabel={t('messages.send')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !inputText.trim() }}
        >
          <Text style={styles.sendButtonText}>{t('messages.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  messageList: {
    padding: SPACING.l,
    gap: SPACING.m,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.tertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
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
    minHeight: 40,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    color: COLORS.paper,
    marginRight: SPACING.m,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});