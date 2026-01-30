import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform, Switch, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, MODAL } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import * as WebBrowser from 'expo-web-browser';
import { registerForPush } from '../../utils/push-notifications';
import { api, getAuthToken } from '../../utils/api';
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
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    getDownloadSavedForOffline().then(setDownloadSaved);
    getOfflineStorageInfo().then(({ count }) => setOfflineCount(count));
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

  const [deleteReason, setDeleteReason] = useState('');

  const handleDeleteAccount = () => {
    setDeleteReason('');
    setDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const lang = (typeof navigator !== 'undefined' && (navigator.language || '').slice(0, 2)) || 'en';
      await api.post('/users/me/request-deletion', {
        reason: deleteReason.trim() || undefined,
        lang,
      });
      setDeleteAccountModalVisible(false);
      setDeleteReason('');
      showSuccess(t('settings.deletionEmailSent', 'Check your email and click the link within 24 hours to delete your account.'));
    } catch (e: any) {
      showError(e?.message || t('settings.deleteAccountFailed', 'Failed to delete account'));
    } finally {
      setDeletingAccount(false);
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
      <ScreenHeader title={t('settings.title')} paddingTop={insets.top} />

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
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && styles.itemPressed]}
            onPress={handleRequestMyData}
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
            onPress={() => openLink('https://cite.app/terms')}
          />
          <SettingItem
            icon="lock-outline"
            label={t('welcome.privacy')}
            onPress={() => openLink('https://cite.app/privacy')}
          />
          <SettingItem
            icon="info-outline"
            label={t('welcome.imprint')}
            onPress={() => openLink('https://cite.app/imprint')}
          />
        </View>

        <View style={styles.section}>
          <SettingItem
            icon="logout"
            label={t('settings.signOut')}
            onPress={handleSignOut}
            destructive
          />
        </View>

        <View style={[styles.section, styles.dangerZone]}>
          <Text style={styles.dangerZoneTitle}>{t('settings.dangerZone', 'Danger zone')}</Text>
          <Text style={styles.dangerZoneHint}>{t('settings.dangerZoneHint', 'These actions are permanent and cannot be undone.')}</Text>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.item, styles.dangerZoneItem, pressed && styles.itemPressed]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
          >
            <View style={styles.itemLeft}>
              {deletingAccount ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <MaterialIcons name="delete-forever" size={HEADER.iconSize} color={COLORS.error} />
              )}
              <Text style={[styles.itemLabel, styles.itemLabelDestructive]}>{t('settings.deleteAccount', 'Delete account')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
          </Pressable>
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
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutModalVisible(false)}
      />
      <Modal visible={deleteAccountModalVisible} transparent animationType="fade">
        <Pressable style={styles.deleteModalOverlay} onPress={() => { setDeleteAccountModalVisible(false); setDeleteReason(''); }}>
          <View style={[styles.deleteModalCard, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.deleteModalTitle}>{t('settings.deleteAccount', 'Delete account')}</Text>
            <Text style={styles.deleteModalMessage}>
              {t('settings.deleteAccountConfirmEmail', 'We will send a confirmation link to your email. Click it within 24 hours to permanently delete your account.')}
            </Text>
            <Text style={styles.deleteModalLabel}>{t('settings.deleteReasonOptional', 'Reason for leaving (optional, for our records)')}</Text>
            <TextInput
              style={styles.deleteReasonInput}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder={t('settings.deleteReasonPlaceholder', 'e.g. privacy, not using anymore')}
              placeholderTextColor={COLORS.tertiary}
              multiline
              numberOfLines={2}
              maxLength={500}
              editable={!deletingAccount}
            />
            <View style={styles.deleteModalActions}>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.deleteModalButton, styles.deleteModalCancel, pressed && styles.buttonPressed]}
                onPress={() => { setDeleteAccountModalVisible(false); setDeleteReason(''); }}
                disabled={deletingAccount}
              >
                <Text style={styles.deleteModalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.deleteModalButton, styles.deleteModalConfirm, pressed && styles.buttonPressed, deletingAccount && styles.buttonDisabled]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>{t('settings.sendDeletionLink', 'Send confirmation email')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  dangerZone: {
    marginTop: SPACING.xxl,
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
    textTransform: 'uppercase',
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  dangerZoneHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.s,
    fontFamily: FONTS.regular,
  },
  dangerZoneItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
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
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: MODAL.backdropBackgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  deleteModalCard: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderRadius: MODAL.sheetBorderRadius,
    borderWidth: MODAL.sheetBorderWidth,
    borderColor: MODAL.sheetBorderColor,
    padding: SPACING.xl,
    minWidth: 280,
    maxWidth: 340,
  },
  deleteModalTitle: {
    fontSize: MODAL.sheetTitleFontSize,
    fontWeight: MODAL.sheetTitleFontWeight,
    color: MODAL.sheetTitleColor,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
  },
  deleteModalMessage: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.m,
  },
  deleteModalLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  deleteReasonInput: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    minHeight: 56,
    marginBottom: SPACING.xl,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: SPACING.m,
    justifyContent: 'flex-end',
  },
  deleteModalButton: {
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
  deleteModalCancel: {
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  deleteModalCancelText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
  deleteModalConfirm: {
    backgroundColor: MODAL.destructiveButtonBackgroundColor,
  },
  deleteModalConfirmText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.destructiveButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
