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
      <View style={styles.iconWrapper}>
        <MaterialIcons 
          name={reasons[0].toLowerCase().includes('cited') ? "trending-up" : "info-outline"} 
          size={12} 
          color={COLORS.primary} 
        />
      </View>
      <Text style={styles.text}>
        {reasons.join(' • ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(110, 122, 138, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(110, 122, 138, 0.15)',
    borderRadius: SIZES.borderRadiusPill,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: FONTS.semiBold,
  },
});