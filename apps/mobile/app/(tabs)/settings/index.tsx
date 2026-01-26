import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/auth';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { registerForPush } from '../../../utils/push-notifications';
import { getAuthToken } from '../../../utils/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.signOut'), onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const openLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const handlePushEnable = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        await registerForPush(token);
        Alert.alert(t('common.success'), 'Push notifications enabled');
      }
    } catch (error) {
      console.error('Failed to enable push', error);
      Alert.alert(t('common.error'), 'Failed to enable push notifications');
    }
  };

  const SettingItem = ({ icon, label, onPress, destructive = false, value }: any) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
    >
      <View style={styles.itemLeft}>
        <MaterialIcons name={icon} size={24} color={destructive ? COLORS.error : COLORS.secondary} />
        <Text style={[styles.itemLabel, destructive && styles.itemLabelDestructive]}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        <MaterialIcons name="chevron-right" size={24} color={COLORS.tertiary} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <SettingItem
            icon="person-outline"
            label={t('settings.editProfile')}
            onPress={() => router.push('/onboarding/profile')} // Re-use onboarding for edit
          />
          <SettingItem
            icon="translate"
            label={t('settings.languages')}
            onPress={() => router.push('/onboarding/languages')}
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
            onPress={handlePushEnable}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.safety')}</Text>
          <SettingItem
            icon="block"
            label={t('settings.blocked')}
            onPress={() => { /* TODO */ }}
          />
          <SettingItem
            icon="volume-off"
            label={t('settings.muted')}
            onPress={() => { /* TODO */ }}
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
            icon="privacy-tip"
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

        <Text style={styles.version}>Version 1.0.0 (Build 100)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
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
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  itemPressed: {
    backgroundColor: COLORS.hover,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
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
