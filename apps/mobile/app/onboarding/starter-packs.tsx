import React, { useState, useEffect } from 'react';
import { Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useAuth } from '../../context/auth';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  id: string;
  displayName: string;
  handle: string;
  bio?: string;
  isFollowing?: boolean;
}

export default function OnboardingStarterPacksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      // Fetch suggested users using the recommendation engine
      const data = await api.get('/explore/people?limit=10');
      const items = Array.isArray(data.items || data) ? (data.items || data) : [];
      setUsers(items);
    } catch (error) {
      console.error('Failed to load starter packs', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (user: User) => {
    // Optimistic update
    const isFollowing = !user.isFollowing;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing } : u));

    try {
      if (isFollowing) {
        await api.post(`/users/${user.id}/follow`);
      } else {
        await api.delete(`/users/${user.id}/follow`);
      }
    } catch (error) {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: !isFollowing } : u));
      console.error('Follow toggle failed', error);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    await completeOnboarding();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding.starterPacks.starterPackTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.starterPacks.starterPackSubtitle')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {users.map((user) => (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.displayName?.charAt(0) || user.handle?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.displayName}</Text>
                  <Text style={styles.userHandle}>@{user.handle}</Text>
                  {user.bio && (
                    <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>
                  )}
                </View>
                <Pressable
                  style={[styles.followButton, user.isFollowing && styles.followingButton]}
                  onPress={() => toggleFollow(user)}
                >
                  <Text style={[styles.followText, user.isFollowing && styles.followingText]}>
                    {user.isFollowing ? t('profile.following') : t('profile.follow')}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <Pressable
          style={[styles.button, finishing && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={finishing}
        >
          <Text style={styles.buttonText}>
            {finishing ? t('common.loading') : t('onboarding.finish')}
          </Text>
          <MaterialIcons name="check" size={HEADER.iconSize} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    alignItems: 'center',
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.divider,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  list: {
    gap: SPACING.l,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.m,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  userInfo: {
    flex: 1,
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
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  followButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.primary,
  },
  followText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  followingText: {
    color: '#FFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.borderRadius,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.semiBold,
  },
});
