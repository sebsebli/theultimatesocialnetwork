import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS, HEADER, createStyles } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, SPACING.s) }]}>
      <MaterialIcons name="wifi-off" size={HEADER.iconSize} color={COLORS.paper} />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = createStyles({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.s,
    gap: SPACING.s,
  },
  text: {
    color: COLORS.paper,
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
