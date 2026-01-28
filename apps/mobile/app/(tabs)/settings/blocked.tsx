import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../../context/ToastContext';

interface BlockedUser {
  id: string;
  blockedId?: string;
  blocked?: {
    id: string;
    displayName: string;
    handle: string;
  };
  displayName?: string;
  handle?: string;
}

export default function BlockedAccountsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlocked = async () => {
    try {
      const data = await api.get('/safety/blocked');
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showError(t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      await api.delete(`/safety/block/${userId}`);
      setBlockedUsers(prev => prev.filter(b => b.blockedId !== userId && b.id !== userId));
      showSuccess(t('common.success'));
    } catch (error) {
      console.error(error);
      showError(t('common.error'));
    }
  };

  const renderItem = ({ item }: { item: BlockedUser }) => {
    const user = item.blocked || item; // Handle direct user object or relation
    return (
      <View style={styles.item}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.displayName?.charAt(0) || '?'}</Text>
          </View>
          <View>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.handle}>@{user.handle}</Text>
          </View>
        </View>
        <Pressable
          style={styles.unblockButton}
          onPress={() => handleUnblock(user.id)}
        >
          <Text style={styles.unblockText}>{t('common.cancel', 'Unblock')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.blockedAccounts')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item: BlockedUser) => item.id || item.blockedId || ''}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBlocked(); }} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('common.empty', 'No blocked accounts')}</Text>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  list: {
    padding: SPACING.l,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.l,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
  },
  handle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  unblockButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 16,
  },
});
