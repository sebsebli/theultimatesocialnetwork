import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface WhyLabelProps {
  reasons: string[];
}

export function WhyLabel({ reasons }: WhyLabelProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={12} color={COLORS.primary} />
      <Text style={styles.text}>{reasons[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(110, 122, 138, 0.1)', // primary/10
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(110, 122, 138, 0.2)',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
