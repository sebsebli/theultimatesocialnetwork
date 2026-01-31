import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ScreenHeader } from '../../components/ScreenHeader';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState<{ id: string; displayName: string } | null>(null);

  const loadBlocked = async () => {
    try {
      const data = await api.get<Array<{ id: string; displayName: string; handle: string }>>('/safety/blocked');
      const list = Array.isArray(data) ? data.filter((u) => u.id) : [];
      setBlocked(list);
    } catch (error) {
      console.error('Failed to load blocked users', error);
      showError(t('safety.failedLoadBlocked', 'Failed to load blocked users. Pull to refresh.'));
      setBlocked([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlocked();
  }, []);

  const handleUnblock = (userId: string, displayName: string) => setUnblockTarget({ id: userId, displayName });

  const confirmUnblock = async () => {
    const targetId = unblockTarget?.id;
    if (!targetId) return;
    setUnblockTarget(null);
    try {
      await api.delete(`/safety/block/${targetId}`);
      setBlocked(prev => prev.filter(u => u.id !== targetId));
      showSuccess(t('safety.unblockedMessage', 'This user has been unblocked.'));
    } catch (error) {
      console.error('Failed to unblock user', error);
      showError(t('safety.failedUnblock', 'Failed to unblock user.'));
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.displayName || item.handle || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.displayName} numberOfLines={1}>
          {item.displayName || item.handle || t('safety.unknownUser', 'Unknown user')}
        </Text>
        {item.handle ? (
          <Text style={styles.handle} numberOfLines={1}>@{item.handle}</Text>
        ) : null}
      </View>
      <Pressable
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.id, item.displayName || item.handle)}
        accessibilityLabel={t('safety.unblock', 'Unblock')}
        accessibilityRole="button"
      >
        <Text style={styles.unblockButtonText}>{t('safety.unblock', 'Unblock')}</Text>
      </Pressable>
    </View>
  ), []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBlocked();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('settings.blockedAccounts', 'Blocked Accounts')} paddingTop={insets.top} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('settings.blockedAccounts', 'Blocked Accounts')} paddingTop={insets.top} />

      <FlatList
        data={blocked}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('safety.noBlocked', 'No blocked users')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <ConfirmModal
        visible={!!unblockTarget}
        title={t('safety.unblockUser', 'Unblock User')}
        message={unblockTarget ? t('safety.unblockConfirm', `Are you sure you want to unblock ${unblockTarget.displayName || unblockTarget.id || 'this user'}?`) : ''}
        confirmLabel={t('safety.unblock', 'Unblock')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmUnblock}
        onCancel={() => setUnblockTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
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
  unblockButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },
  unblockButtonText: {
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
