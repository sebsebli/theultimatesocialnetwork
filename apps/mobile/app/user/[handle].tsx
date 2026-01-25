import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function UserProfileScreen() {
  const router = useRouter();
  const { handle } = useLocalSearchParams();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'collections'>('posts');

  const loadProfile = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get(`/users/${handle}`);
      setUser(data);
      setFollowing((data as any).isFollowing || false);
      
      // Load posts/replies/quotes with pagination
      let postsData;
      if (activeTab === 'replies') {
        postsData = await api.get(`/users/${data.id}/replies?page=${pageNum}&limit=20`);
      } else if (activeTab === 'quotes') {
        postsData = await api.get(`/users/${data.id}/quotes?page=${pageNum}&limit=20`);
      } else if (activeTab === 'collections') {
        postsData = await api.get(`/users/${data.id}/collections?page=${pageNum}&limit=20`);
      } else {
        postsData = await api.get(`/users/${data.id}/posts?page=${pageNum}&limit=20&type=${activeTab}`);
      }
      const items = Array.isArray(postsData.items || postsData) ? (postsData.items || postsData) : [];
      
      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }
      
      const hasMoreData = items.length === 20 && (postsData.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error: any) {
      console.error('Failed to load profile', error);
      // Show user-friendly error
      if (reset && !user) {
        const { Alert } = require('react-native');
        Alert.alert(
          t('common.error', 'Error'),
          t('profile.loadError', 'Failed to load profile. Please try again.')
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setPosts([]);
    loadProfile(1, true);
  }, [handle, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile(1, true);
  };

  const handleLoadMore = useCallback(() => {
    if (!refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProfile(nextPage, false);
    }
  }, [refreshing, loadingMore, hasMore, page, handle, activeTab]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <PostItem post={item} />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  const handleFollow = async () => {
    try {
      if (following) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }
      setFollowing(!following);
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  const handleMessage = async () => {
    try {
      const thread = await api.post('/messages/threads', { userId: user.id });
      if (thread && thread.id) {
        router.push(`/messages/${thread.id}`);
      }
    } catch (error) {
      console.error('Failed to create thread', error);
      // Fallback: just go to inbox if fails
      router.push('/(tabs)/inbox');
    }
  };

  const handleBlock = async () => {
    Alert.alert(
      t('safety.blockUser', 'Block User'),
      t('safety.blockConfirm', `Are you sure you want to block @${user.handle}? You won't see their posts or messages.`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('safety.block', 'Block'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/safety/block/${user.id}`);
              Alert.alert(t('safety.blocked', 'User Blocked'), t('safety.blockedMessage', 'This user has been blocked.'));
              router.back();
            } catch (error) {
              console.error('Failed to block user', error);
              Alert.alert(t('common.error', 'Error'), t('safety.failedBlock', 'Failed to block user.'));
            }
          }
        }
      ]
    );
  };

  const handleMute = async () => {
    Alert.alert(
      t('safety.muteUser', 'Mute User'),
      t('safety.muteConfirm', `Are you sure you want to mute @${user.handle}? You won't see their posts in your feed.`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('safety.mute', 'Mute'),
          onPress: async () => {
            try {
              await api.post(`/safety/mute/${user.id}`);
              Alert.alert(t('safety.muted', 'User Muted'), t('safety.mutedMessage', 'This user has been muted.'));
            } catch (error) {
              console.error('Failed to mute user', error);
              Alert.alert(t('common.error', 'Error'), t('safety.failedMute', 'Failed to mute user.'));
            }
          }
        }
      ]
    );
  };

  const handleUserMenu = () => {
    Alert.alert(
      t('profile.options', 'User Options'),
      undefined,
      [
        { text: t('safety.block', 'Block User'), onPress: handleBlock, style: 'destructive' },
        { text: t('safety.mute', 'Mute User'), onPress: handleMute },
        { text: t('safety.report', 'Report User'), onPress: () => handleReport(user.id, 'USER'), style: 'destructive' },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleReport = async (targetId: string, type: 'POST' | 'REPLY' | 'USER') => {
    Alert.alert(
      t('safety.reportTitle', 'Report'),
      t('safety.reportMessage', 'Are you sure you want to report this?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('safety.report', 'Report'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/safety/report', {
                targetId,
                targetType: type,
                reason: 'Reported via mobile app',
              });
              Alert.alert(t('common.success', 'Success'), t('safety.reportSuccess', 'Report submitted successfully'));
            } catch (error) {
              console.error('Failed to report', error);
              Alert.alert(t('common.error', 'Error'), t('safety.reportError', 'Failed to submit report'));
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.secondary} size="large" style={{ marginTop: 50 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('profile.userNotFound')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <View style={styles.headerBar}>
            <Pressable 
              onPress={() => router.back()} 
              style={styles.iconButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.paper} />
            </Pressable>
            <Pressable 
              style={styles.iconButton}
              onPress={() => handleUserMenu()}
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <MaterialIcons name="more-horiz" size={24} color={COLORS.paper} />
            </Pressable>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.displayName?.charAt(0) || user.handle?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.identityBlock}>
              <Text style={styles.name}>{user.displayName}</Text>
              <Text style={styles.handle}>@{user.handle}</Text>
            </View>

            {user.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}

        <View style={styles.actions}>
          <Pressable 
            style={[styles.actionButtonOutline, following && styles.actionButtonActive]}
            onPress={handleFollow}
            accessibilityLabel={following ? t('profile.following') : t('profile.follow')}
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, following && styles.actionButtonTextActive]}>
              {following ? t('profile.following') : t('profile.follow')}
            </Text>
          </Pressable>
          
          <Pressable 
            style={styles.messageButton}
            onPress={handleMessage}
            accessibilityLabel={t('profile.message')}
            accessibilityRole="button"
          >
            <MaterialIcons name="mail-outline" size={20} color={COLORS.paper} />
          </Pressable>
        </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followerCount}</Text>
              <Text style={styles.statLabel}>{t('profile.followers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followingCount}</Text>
              <Text style={styles.statLabel}>{t('profile.following')}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color={COLORS.tertiary} />
              </View>
              <Text style={styles.statNumber}>{user.quoteReceivedCount}</Text>
              <Text style={[styles.statLabel, { color: COLORS.primary }]}>{t('profile.quotes')}</Text>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            {(['posts', 'replies', 'quotes', 'collections'] as const).map((tab) => (
              <Pressable 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityLabel={t(`profile.${tab}`)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {t(`profile.${tab}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('profile.noPosts')}</Text>
        </View>
      }
      ListFooterComponent={ListFooterComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.header + 10,
    paddingBottom: SPACING.s,
  },
  iconButton: {
    padding: SPACING.s,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.l,
    gap: SPACING.l,
  },
  avatarContainer: {
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 96, // h-24
    height: 96,
    borderRadius: 48, // rounded-full
    backgroundColor: 'rgba(110, 122, 138, 0.2)', // bg-primary/20
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  identityBlock: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 24, // text-2xl
    fontWeight: '700',
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
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: FONTS.regular,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginTop: SPACING.xs,
  },
  actionButtonOutline: {
    height: 38,
    minWidth: 120,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 0,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.tertiary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  tabTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontFamily: FONTS.medium,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
