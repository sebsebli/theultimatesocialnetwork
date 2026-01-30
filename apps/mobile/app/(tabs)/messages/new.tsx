import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';
import { api } from '../../../utils/api';
import { UserCard } from '../../../components/UserCard';
import { useAuth } from '../../../context/auth';
import { useToast } from '../../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';

export default function NewMessageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId: currentUserId } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setSuggestedLoading(true);
      try {
        const res = await api.get('/users/me/suggested?limit=20');
        const list = Array.isArray(res) ? res : [];
        setSuggested(list.filter((u: any) => u.id && u.id !== currentUserId));
      } catch (error) {
        console.error(error);
        setSuggested([]);
      } finally {
        setSuggestedLoading(false);
      }
    };
    load();
  }, [currentUserId]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search/users?q=${encodeURIComponent(query.trim())}&limit=20`);
        const hits = res.hits || [];
        setResults(hits.filter((u: any) => u.id !== currentUserId));
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  const handleSelectUser = async (user: any) => {
    try {
      const thread = await api.post('/messages/threads', { userId: user.id });
      if (thread && thread.id) {
        router.replace(`/(tabs)/messages/${thread.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create thread', error);
      const msg = error?.message ?? '';
      if (error?.status === 403 && /follow each other|prior interaction/i.test(msg)) {
        showError(t('messages.mustFollowOrPrior', 'You can only message people who follow you back or who you\'ve messaged before.'));
      } else {
        showError(t('messages.createThreadFailed', 'Could not start conversation. Try again.'));
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('messages.newMessage', 'New Message')} paddingTop={insets.top} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('messages.searchUsers', 'Search people...')}
          placeholderTextColor={COLORS.tertiary}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={query.trim() ? results : suggested}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item }: { item: { id: string; handle: string; displayName: string; bio?: string; avatarUrl?: string; isFollowing?: boolean } }) => (
            <UserCard
              item={{
                id: item.id,
                handle: item.handle,
                displayName: item.displayName,
                bio: item.bio,
                avatarUrl: item.avatarUrl,
                isFollowing: item.isFollowing,
              }}
              onPress={() => handleSelectUser(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            ) : suggestedLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <Text style={styles.emptyText}>{t('messages.noSuggested', 'No suggested people to message.')}</Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  searchContainer: {
    padding: SPACING.m,
  },
  searchInput: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.secondary,
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
});
