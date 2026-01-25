import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="wifi-off" size={16} color={COLORS.paper} />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
  },
  text: {
    color: COLORS.paper,
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
