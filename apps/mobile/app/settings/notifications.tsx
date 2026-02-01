import React, { useState, useEffect } from 'react';
import { Text, View, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, createStyles } from '../../constants/theme';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    push_enabled: true,
    replies: true,
    quotes: true,
    mentions: true,
    dms: true,
    follows: true,
    saves: false,
    email_marketing: false,
    email_product_updates: false,
  });

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const data = await api.get<Record<string, boolean>>('/users/me/notification-prefs');
      if (data && typeof data === 'object') {
        setPrefs(prev => ({
          ...prev,
          push_enabled: data.push_enabled ?? prev.push_enabled,
          replies: data.replies ?? prev.replies,
          quotes: data.quotes ?? prev.quotes,
          mentions: data.mentions ?? prev.mentions,
          dms: data.dms ?? prev.dms,
          follows: data.follows ?? prev.follows,
          saves: data.saves ?? prev.saves,
          email_marketing: data.email_marketing ?? prev.email_marketing,
          email_product_updates: data.email_product_updates ?? prev.email_product_updates,
        }));
      }
    } catch (error) {
      console.error('Failed to load notification prefs', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePref = async (key: keyof typeof prefs) => {
    const newVal = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newVal }));
    try {
      await api.patch('/users/me/notification-prefs', { [key]: newVal });
    } catch (error) {
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
      <ScreenHeader title={t('settings.notifications')} paddingTop={insets.top} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
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
              label={t('notifications.dms', 'Direct messages')}
              description={t('notifications.dmsDesc', 'When someone sends you a direct message')}
              value={prefs.dms}
              onValueChange={() => togglePref('dms')}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.email', 'Email')}</Text>
          <Text style={styles.systemNote}>{t('notifications.systemEmailsAlways', 'System messages (sign-in, security, account) are always sent.')}</Text>
          <NotificationItem
            label={t('notifications.emailMarketing', 'Marketing & promotions')}
            description={t('notifications.emailMarketingDesc', 'News, offers and product updates from Citewalk')}
            value={prefs.email_marketing}
            onValueChange={() => togglePref('email_marketing')}
          />
          <NotificationItem
            label={t('notifications.emailProductUpdates', 'Product updates & tips')}
            description={t('notifications.emailProductUpdatesDesc', 'New features and how to get the most out of Citewalk')}
            value={prefs.email_product_updates}
            onValueChange={() => togglePref('email_product_updates')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
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
  systemNote: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
  },
});
