import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useAuth } from '../context/auth';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showSaves, setShowSaves] = useState(true);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await api.get('/users/me');
      setUser(data);
      // Load settings if available in user object
      if (data.settings) {
        setPushEnabled(data.settings.pushEnabled ?? true);
        setShowSaves(data.settings.showSaves ?? true);
        setEnableRecommendations(data.settings.enableRecommendations ?? true);
      }
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    // Optimistic update
    if (key === 'pushEnabled') setPushEnabled(value);
    if (key === 'showSaves') setShowSaves(value);
    if (key === 'enableRecommendations') setEnableRecommendations(value);

    try {
      // Attempt to save to backend
      await api.patch('/users/me/settings', { [key]: value });
    } catch (error) {
      console.error(`Failed to update setting ${key}`, error);
      // Revert if failed (optional, but good UX)
      // For now we assume success or silent fail for settings to feel snappy
    }
  };

  const handleExport = async () => {
    try {
      Linking.openURL('https://cite.app/api/me/export'); 
      Alert.alert(t('settings.exportStarted'), t('settings.exportCheckBrowser'));
    } catch (error) {
      Alert.alert(t('settings.error'), t('settings.failedExport'));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('settings.deleteConfirm'),
      t('settings.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.deleteButton'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              router.replace('/welcome');
            } catch (error) {
              Alert.alert(t('settings.error'), t('settings.failedDelete'));
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>{t('settings.email')}</Text>
            <Text style={styles.settingValue}>{user?.email || t('common.loading')}</Text>
          </View>
          <Pressable onPress={() => Alert.alert(t('settings.changeEmail'), t('settings.contactSupport'))}>
            <Text style={styles.settingAction}>{t('settings.change')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.settingButton} onPress={signOut}>
          <Text style={styles.settingButtonText}>{t('settings.signOut')}</Text>
        </Pressable>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>{t('settings.accountType')}</Text>
            <Text style={styles.settingValue}>{t('settings.open')}</Text>
          </View>
          <Pressable onPress={() => Alert.alert(t('common.comingSoon'), t('settings.privacyChangeInfo'))}>
            <Text style={styles.settingAction}>{t('settings.change')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>{t('settings.pushNotifications')}</Text>
            <Text style={styles.settingValue}>{t('settings.pushNotificationsDesc')}</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={(val) => updateSetting('pushEnabled', val)}
            trackColor={{ false: COLORS.hover, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.feed')}</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>{t('settings.showSaves')}</Text>
            <Text style={styles.settingValue}>{t('settings.showSavesDesc')}</Text>
          </View>
          <Switch
            value={showSaves}
            onValueChange={(val) => updateSetting('showSaves', val)}
            trackColor={{ false: COLORS.hover, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Explore */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.explore')}</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>{t('settings.enableRecommendations')}</Text>
            <Text style={styles.settingValue}>{t('settings.enableRecommendationsDesc')}</Text>
          </View>
          <Switch
            value={enableRecommendations}
            onValueChange={(val) => updateSetting('enableRecommendations', val)}
            trackColor={{ false: COLORS.hover, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Pressable
          style={styles.settingButton}
          onPress={() => router.push('/settings/relevance')}
        >
          <Text style={styles.settingButtonText}>{t('settings.relevanceControls')}</Text>
          <Text style={styles.settingButtonSubtext}>{t('settings.relevanceControlsDesc')}</Text>
        </Pressable>
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.languages')}</Text>
        <Pressable
          style={styles.settingButton}
          onPress={() => router.push('/settings/languages')}
        >
          <Text style={styles.settingButtonText}>{t('settings.manageLanguages')}</Text>
          <Text style={styles.settingButtonSubtext}>English, German</Text>
        </Pressable>
      </View>

      {/* Safety */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.safety')}</Text>
        <Pressable
          style={styles.settingButton}
          onPress={() => router.push('/settings/blocked')}
        >
          <Text style={styles.settingButtonText}>{t('settings.blockedAccounts')}</Text>
        </Pressable>
        <Pressable
          style={styles.settingButton}
          onPress={() => router.push('/settings/muted')}
        >
          <Text style={styles.settingButtonText}>{t('settings.mutedAccounts')}</Text>
        </Pressable>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <Pressable style={styles.settingButton} onPress={handleExport}>
          <Text style={styles.settingButtonText}>{t('settings.exportArchive')}</Text>
          <Text style={styles.settingButtonSubtext}>{t('settings.exportArchiveDesc')}</Text>
        </Pressable>
        <Pressable style={[styles.settingButton, styles.settingButtonDanger]} onPress={handleDelete}>
          <Text style={[styles.settingButtonText, styles.settingButtonTextDanger]}>
            {t('settings.deleteAccount')}
          </Text>
          <Text style={styles.settingButtonSubtext}>{t('settings.deleteAccountDesc')}</Text>
        </Pressable>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
        <Pressable style={styles.settingButton} onPress={() => router.push('/terms')}>
          <Text style={styles.settingButtonText}>{t('settings.termsOfService')}</Text>
        </Pressable>
        <Pressable style={styles.settingButton} onPress={() => router.push('/privacy')}>
          <Text style={styles.settingButtonText}>{t('settings.privacyPolicy')}</Text>
        </Pressable>
        <Pressable style={styles.settingButton} onPress={() => router.push('/imprint')}>
          <Text style={styles.settingButtonText}>{t('settings.imprint')}</Text>
        </Pressable>
      </View>
    </ScrollView>
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
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: SIZES.iconLarge,
  },
  section: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.paper,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  settingAction: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  settingButton: {
    padding: SPACING.l,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  settingButtonDanger: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  settingButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.paper,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  settingButtonTextDanger: {
    color: COLORS.error,
  },
  settingButtonSubtext: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
});