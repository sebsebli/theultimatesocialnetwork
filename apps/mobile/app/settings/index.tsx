import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform, Switch, ActivityIndicator, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import * as WebBrowser from 'expo-web-browser';
import { registerForPush } from '../../utils/push-notifications';
import { api, getAuthToken, getApiBaseUrl } from '../../utils/api';
import {
  getDownloadSavedForOffline,
  setDownloadSavedForOffline,
  getOfflineStorageInfo,
  clearAllOfflinePosts,
} from '../../utils/offlineStorage';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const [downloadSaved, setDownloadSaved] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [requestingData, setRequestingData] = useState(false);
  const [requestDataModalVisible, setRequestDataModalVisible] = useState(false);
  const [me, setMe] = useState<{ handle?: string } | null>(null);

  useEffect(() => {
    getDownloadSavedForOffline().then(setDownloadSaved);
    getOfflineStorageInfo().then(({ count }) => setOfflineCount(count));
  }, []);

  useEffect(() => {
    api.get<{ handle?: string }>('/users/me').then(setMe).catch(() => {});
  }, []);

  const onDownloadSavedToggle = async (value: boolean) => {
    await setDownloadSavedForOffline(value);
    setDownloadSaved(value);
    if (value) {
      getOfflineStorageInfo().then(({ count }) => setOfflineCount(count));
    } else {
      await clearAllOfflinePosts();
      setOfflineCount(0);
    }
  };

  const handleSignOut = () => setSignOutModalVisible(true);

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    await signOut();
  };

  const handleRequestMyData = async () => {
    setRequestDataModalVisible(false);
    setRequestingData(true);
    try {
      await api.post('/users/me/request-export');
      showSuccess(t('settings.exportEmailSent', 'Check your email for a download link. The link expires in 7 days and can only be used once.'));
    } catch (e: any) {
      const status = e?.status;
      if (status === 429) {
        showError(t('settings.exportRateLimit', 'You can only request a data export once per 24 hours. Please try again later.'));
      } else {
        showError(e?.message ?? t('settings.myDataExportFailed', 'Failed to request your data'));
      }
    } finally {
      setRequestingData(false);
    }
  };

  const openLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const handlePushEnable = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        await registerForPush(token);
        showSuccess(t('settings.pushEnabled', 'Push notifications enabled'));
      }
    } catch (error) {
      console.error('Failed to enable push', error);
      showError(t('settings.pushEnableError', 'Failed to enable push notifications'));
    }
  };

  const SettingItem = ({ icon, label, onPress, destructive = false, value }: any) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
    >
      <View style={styles.itemLeft}>
        <MaterialIcons name={icon} size={HEADER.iconSize} color={destructive ? COLORS.error : COLORS.secondary} />
        <Text style={[styles.itemLabel, destructive && styles.itemLabelDestructive]}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('settings.title')} titleIcon="settings" paddingTop={insets.top} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <SettingItem
            icon="person-outline"
            label={t('settings.editProfile')}
            onPress={() => router.push('/settings/profile')}
          />
          <SettingItem
            icon="person-add"
            label={t('settings.inviteFriends', 'Invite Friends')}
            onPress={() => router.push('/invites')}
          />
          <SettingItem
            icon="language"
            label={t('settings.languages')}
            onPress={() => router.push('/settings/languages')}
          />
          <SettingItem
            icon="mail-outline"
            label={t('settings.changeEmail')}
            onPress={() => router.push('/settings/change-email')}
          />
          <SettingItem
            icon="warning"
            label={t('settings.dangerZone', 'Danger zone')}
            onPress={() => router.push('/settings/danger-zone')}
            destructive
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.content')}</Text>
          <SettingItem
            icon="tune"
            label={t('settings.relevance')}
            onPress={() => router.push('/settings/relevance')}
          />
          <SettingItem
            icon="notifications-none"
            label={t('settings.notifications')}
            onPress={() => router.push('/settings/notifications')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.offlineReading', 'Offline reading')}</Text>
          <View style={styles.switchRow}>
            <View style={styles.itemLeft}>
              <MaterialIcons name="offline-pin" size={HEADER.iconSize} color={COLORS.secondary} />
              <View>
                <Text style={styles.itemLabel}>{t('settings.downloadSavedOffline', 'Download saved for offline')}</Text>
                <Text style={styles.itemHint}>{t('settings.downloadSavedOfflineHint', 'When on, you can read bookmarked posts without internet. Manage storage below.')}</Text>
              </View>
            </View>
            <Switch
              value={downloadSaved}
              onValueChange={onDownloadSavedToggle}
              trackColor={{ false: COLORS.divider, true: COLORS.primary }}
              thumbColor={COLORS.paper}
            />
          </View>
          <SettingItem
            icon="folder-open"
            label={t('settings.manageOfflineStorage', 'Manage offline storage')}
            value={offlineCount > 0 ? t('settings.offlineCount', '{{count}} articles', { count: offlineCount }) : undefined}
            onPress={() => router.push('/settings/offline-storage')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.safety')}</Text>
          <SettingItem
            icon="block"
            label={t('settings.blocked')}
            onPress={() => router.push('/settings/blocked')}
          />
          <SettingItem
            icon="notifications-off"
            label={t('settings.muted')}
            onPress={() => router.push('/settings/muted')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          <SettingItem
            icon="description"
            label={t('welcome.terms')}
            onPress={() => openLink('https://citewalk.app/terms')}
          />
          <SettingItem
            icon="lock-outline"
            label={t('welcome.privacy')}
            onPress={() => openLink('https://citewalk.app/privacy')}
          />
          <SettingItem
            icon="info-outline"
            label={t('welcome.imprint')}
            onPress={() => openLink('https://citewalk.app/imprint')}
          />
          {me?.handle ? (
            <SettingItem
              icon="rss-feed"
              label={t('settings.myRssFeed', 'My RSS Feed')}
              onPress={() => {
                const url = `${getApiBaseUrl().replace(/\/$/, '')}/rss/${encodeURIComponent(me.handle)}`;
                const title = t('settings.myRssFeed', 'My RSS Feed');
                Share.share(
                  Platform.OS === 'android'
                    ? { message: url, title }
                    : { url, message: url, title },
                ).catch(() => {});
              }}
            />
          ) : null}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => setRequestDataModalVisible(true)}
            disabled={requestingData}
          >
            <View style={styles.itemLeft}>
              {requestingData ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons name="download" size={HEADER.iconSize} color={COLORS.secondary} />
              )}
              <Text style={styles.itemLabel}>{t('settings.requestMyData', 'Request my data')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
          </Pressable>
        </View>

        <View style={[styles.section, styles.signOutSection]}>
          <SettingItem
            icon="logout"
            label={t('settings.signOut')}
            onPress={handleSignOut}
            destructive
          />
        </View>

        <Text style={styles.version}>{t('settings.version', { version: '1.0.0', build: '100', defaultValue: 'Version 1.0.0 (Build 100)' })}</Text>
      </ScrollView>

      <ConfirmModal
        visible={signOutModalVisible}
        title={t('settings.signOut')}
        message={t('settings.signOutConfirm')}
        confirmLabel={t('settings.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        icon="logout"
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutModalVisible(false)}
      />
      <ConfirmModal
        visible={requestDataModalVisible}
        title={t('settings.requestMyData', 'Request my data')}
        message={t('settings.requestDataModalMessage', 'We will send an email to your account address with a secure download link for your data (ZIP). The link expires in 7 days and can only be used once. Continue?')}
        confirmLabel={t('settings.sendExportLink', 'Send link')}
        cancelLabel={t('common.cancel')}
        icon="email"
        onConfirm={handleRequestMyData}
        onCancel={() => setRequestDataModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    paddingBottom: 100,
  },
  section: {
    marginTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: SPACING.s,
  },
  signOutSection: {
    marginTop: SPACING.xxl,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  itemPressed: {
    backgroundColor: COLORS.hover,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  itemHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
    maxWidth: 260,
    fontFamily: FONTS.regular,
  },
  itemLabel: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  itemLabelDestructive: {
    color: COLORS.error,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  itemValue: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: SPACING.xl,
    fontFamily: FONTS.regular,
  },
});
