import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBlocked = async () => {
    try {
      const data = await api.get('/safety/blocked');
      setBlocked(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load blocked users', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlocked();
  }, []);

  const handleUnblock = async (userId: string, displayName: string) => {
    Alert.alert(
      t('safety.unblockUser', 'Unblock User'),
      t('safety.unblockConfirm', `Are you sure you want to unblock ${displayName}?`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('safety.unblock', 'Unblock'),
          onPress: async () => {
            try {
              await api.delete(`/safety/block/${userId}`);
              setBlocked(prev => prev.filter(u => u.id !== userId));
              Alert.alert(t('safety.unblocked', 'User Unblocked'), t('safety.unblockedMessage', 'This user has been unblocked.'));
            } catch (error) {
              console.error('Failed to unblock user', error);
              Alert.alert(t('common.error', 'Error'), t('safety.failedUnblock', 'Failed to unblock user.'));
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings.blockedAccounts', 'Blocked Accounts')}</Text>
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
        <Text style={styles.headerTitle}>{t('settings.blockedAccounts', 'Blocked Accounts')}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={blocked}
        keyExtractor={(item) => item.id}
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
