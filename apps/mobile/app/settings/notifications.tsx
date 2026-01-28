import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    push_enabled: true,
    replies: true,
    quotes: true,
    mentions: true,
    follows: true,
    saves: false,
  });

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      // Mock loading - replace with actual API call
      // const data = await api.get('/me/notification-prefs');
      // setPrefs(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load notification prefs', error);
      setLoading(false);
    }
  };

  const togglePref = async (key: keyof typeof prefs) => {
    const newVal = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newVal }));
    
    try {
      // await api.patch('/me/notification-prefs', { [key]: newVal });
    } catch (error) {
      // Revert on error
      setPrefs(prev => ({ ...prev, [key]: !newVal }));
      showError(t('common.error'));
    }
  };

  const NotificationItem = ({ label, value, onValueChange, description }: any) => (
    <View style={styles.item}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        trackColor={{ false: COLORS.divider, true: COLORS.primary }}
        thumbColor={'#FFF'}
        ios_backgroundColor={COLORS.divider}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.notifications')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.push')}</Text>
          <NotificationItem
            label={t('notifications.enablePush', 'Enable Push Notifications')}
            value={prefs.push_enabled}
            onValueChange={() => togglePref('push_enabled')}
          />
        </View>

        {prefs.push_enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notifications.types', 'Notification Types')}</Text>
            <NotificationItem
              label={t('notifications.replies', 'Replies')}
              value={prefs.replies}
              onValueChange={() => togglePref('replies')}
            />
            <NotificationItem
              label={t('notifications.quotes', 'Quotes')}
              value={prefs.quotes}
              onValueChange={() => togglePref('quotes')}
            />
            <NotificationItem
              label={t('notifications.mentions', 'Mentions')}
              value={prefs.mentions}
              onValueChange={() => togglePref('mentions')}
            />
            <NotificationItem
              label={t('notifications.follows', 'New Followers')}
              value={prefs.follows}
              onValueChange={() => togglePref('follows')}
            />
            <NotificationItem
              label={t('notifications.saves', 'Saves')}
              description={t('notifications.savesDesc', 'When someone saves your post to a public collection')}
              value={prefs.saves}
              onValueChange={() => togglePref('saves')}
            />
          </View>
        )}
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
  content: {
    padding: SPACING.l,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hover,
  },
  textContainer: {
    flex: 1,
    paddingRight: SPACING.m,
  },
  label: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  description: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
});
