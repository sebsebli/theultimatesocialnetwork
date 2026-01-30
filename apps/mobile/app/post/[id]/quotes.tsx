import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../utils/api';
import { COLORS, SPACING, FONTS, LAYOUT } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { PostItem } from '../../../components/PostItem';
import { Post } from '../../../types';

export default function PostQuotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const postId = params.id as string;
  const [quotes, setQuotes] = useState<Post[]>([]);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      const [postData, referencedBy] = await Promise.all([
        api.get<{ title?: string }>(`/posts/${postId}`),
        api.get<Post[]>(`/posts/${postId}/referenced-by`),
      ]);
      setPostTitle(postData?.title ?? null);
      setQuotes(Array.isArray(referencedBy) ? referencedBy : []);
    } catch (error) {
      console.error('Failed to load quotes', error);
      setQuotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`${t('post.quotedBy', 'Quoted by')} ${quotes.length > 0 ? `(${quotes.length})` : ''}`}
        paddingTop={insets.top}
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {postTitle ? (
          <Text style={styles.postTitleLabel} numberOfLines={1}>
            {postTitle}
          </Text>
        ) : null}

        {quotes.length === 0 ? (
          <Text style={styles.emptyText}>{t('post.noQuotesYet', 'No one has quoted this post yet.')}</Text>
        ) : (
          quotes.map((post) => <PostItem key={post.id} post={post} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: SPACING.l },
  postTitleLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginBottom: SPACING.m,
    marginHorizontal: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  emptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
});
