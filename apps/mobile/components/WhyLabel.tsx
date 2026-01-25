import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface WhyLabelProps {
  reasons: string[];
}

export function WhyLabel({ reasons }: WhyLabelProps) {
  if (reasons.length === 0) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
      <Text style={styles.text}>
        Why: {reasons.join(' + ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    backgroundColor: 'rgba(110, 122, 138, 0.1)', // bg-primary/10
    borderWidth: 1,
    borderColor: 'rgba(110, 122, 138, 0.2)', // border-primary/20
    borderRadius: SIZES.borderRadius,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  text: {
    fontSize: 11, // text-xs
    fontWeight: '700', // font-bold
    color: COLORS.primary, // text-primary
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
});