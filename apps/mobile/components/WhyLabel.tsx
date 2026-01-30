import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, HEADER } from '../constants/theme';

interface WhyLabelProps {
  reasons: string[];
}

export function WhyLabel({ reasons }: WhyLabelProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
      <Text style={styles.text}>{reasons[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 9,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    letterSpacing: 0.3,
  },
});
