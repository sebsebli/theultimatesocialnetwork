import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, createStyles } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isOffline) return null;

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, SPACING.s) }]}
      accessibilityLabel={t('common.offline', "You're offline. Some features may be unavailable.")}
      accessibilityRole="alert"
    >
      <Text style={styles.text}>
        {t('common.offline', "You're offline. Some features may be unavailable.")}
      </Text>
    </View>
  );
}

const styles = createStyles({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  text: {
    color: COLORS.paper,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});
