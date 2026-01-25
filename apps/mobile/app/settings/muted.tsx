import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function MutedUsersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [muted, setMuted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMuted = async () => {
    try {
      const data = await api.get('/safety/muted');
      setMuted(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load muted users', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMuted();
  }, []);

  const handleUnmute = async (userId: string, displayName: string) => {
    Alert.alert(
      t('safety.unmuteUser', 'Unmute User'),
      t('safety.unmuteConfirm', `Are you sure you want to unmute ${displayName}?`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('safety.unmute', 'Unmute'),
          onPress: async () => {
            try {
              await api.delete(`/safety/mute/${userId}`);
              setMuted(prev => prev.filter(u => u.id !== userId));
              Alert.alert(t('safety.unmuted', 'User Unmuted'), t('safety.unmutedMessage', 'This user has been unmuted.'));
            } catch (error) {
              console.error('Failed to unmute user', error);
              Alert.alert(t('common.error', 'Error'), t('safety.failedUnmute', 'Failed to unmute user.'));
            }
          }
        }
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.displayName?.charAt(0) || item.handle?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName || item.handle}</Text>
        <Text style={styles.handle}>@{item.handle}</Text>
      </View>
      <Pressable
        style={styles.unmuteButton}
        onPress={() => handleUnmute(item.id, item.displayName || item.handle)}
        accessibilityLabel={t('safety.unmute', 'Unmute')}
        accessibilityRole="button"
      >
        <Text style={styles.unmuteButtonText}>{t('safety.unmute', 'Unmute')}</Text>
      </Pressable>
    </View>
  ), []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMuted();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings.mutedAccounts', 'Muted Accounts')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.mutedAccounts', 'Muted Accounts')}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={muted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('safety.noMuted', 'No muted users')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.header + 10,
    paddingBottom: SPACING.m,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.l,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  handle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  unmuteButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },
  unmuteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});
