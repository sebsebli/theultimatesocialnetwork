import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingStarterPacksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [suggestedUsers, setSuggestedUsers] = useState<Record<string, any[]>>({});
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  const loadSuggestedUsers = async () => {
    try {
      // Load users grouped by categories
      const categories = ['urbanism', 'philosophy', 'tech'];
      const usersByCategory: Record<string, any[]> = {};
      
      for (const category of categories) {
        try {
          const data = await api.get(`/explore/people?category=${category}`);
          usersByCategory[category] = Array.isArray(data) ? data.slice(0, 5) : [];
        } catch (error) {
          usersByCategory[category] = [];
        }
      }
      
      setSuggestedUsers(usersByCategory);
    } catch (error) {
      console.error('Failed to load suggested users', error);
    }
  };

  const categoryIcons: Record<string, string> = {
    urbanism: 'apartment',
    philosophy: 'settings',
    tech: 'code',
  };

  const categoryLabels: Record<string, string> = {
    urbanism: 'Urbanism',
    philosophy: 'Philosophy',
    tech: 'Tech',
  };

  const toggleFollow = async (userId: string) => {
    const isFollowing = following.has(userId);
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await api.post(`/users/${userId}/follow`);
        setFollowing(prev => new Set(prev).add(userId));
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>{t('onboarding.starterPacks.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.starterPacks.subtitle')}</Text>
      </View>

      <FlatList
        data={Object.entries(suggestedUsers).flatMap(([category, users]) => 
          users.map(user => ({ ...user, category }))
        )}
        keyExtractor={(item, index) => `${item.category}-${item.id || index}`}
        renderItem={({ item, index }) => {
          const isFirstInCategory = index === 0 || 
            (index > 0 && Object.entries(suggestedUsers).find(([cat, users]) => 
              users.some(u => u.id === item.id)
            )?.[0] !== Object.entries(suggestedUsers).find(([cat, users]) => 
              users.some(u => u.id === Object.entries(suggestedUsers).flatMap(([, users]) => users)[index - 1]?.id)
            )?.[0]);
          
          const category = item.category;
          const showCategoryHeader = isFirstInCategory || 
            (index > 0 && Object.entries(suggestedUsers).flatMap(([, users]) => users)[index - 1]?.category !== category);
          
          return (
            <View>
              {showCategoryHeader && (
                <View style={styles.categoryHeader}>
                  <MaterialIcons 
                    name={categoryIcons[category] as any} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.categoryTitle}>{categoryLabels[category]}</Text>
                </View>
              )}
              <View style={styles.userCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.displayName?.charAt(0) || item.handle.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{item.displayName || item.handle}</Text>
                    <Text style={styles.userHandle}>@{item.handle}</Text>
                  </View>
                  {item.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.followButton,
                    following.has(item.id) && styles.followButtonActive,
                  ]}
                  onPress={() => toggleFollow(item.id)}
                  accessibilityLabel={following.has(item.id) ? t('profile.following') : t('profile.follow')}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      following.has(item.id) && styles.followButtonTextActive,
                    ]}
                  >
                    {following.has(item.id) ? t('profile.following') : t('profile.follow')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('onboarding.starterPacks.loadingSuggested')}</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable
          style={styles.finishButton}
          onPress={handleFinish}
          disabled={loading}
        >
          <Text style={styles.finishButtonText}>
            {loading ? t('onboarding.starterPacks.finishing') : t('onboarding.starterPacks.finish')}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>{t('onboarding.starterPacks.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  userHandle: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  userBio: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  followButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 80,
  },
  followButtonActive: {
    backgroundColor: COLORS.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  footer: {
    padding: SPACING.l,
    gap: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  finishButton: {
    height: 50,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  skipText: {
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontFamily: FONTS.medium,
  },
});