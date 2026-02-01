import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, HEADER, createStyles } from '../constants/theme';

export interface WhyLabelProps {
  reasons: string[];
}

function WhyLabelInner({ reasons }: WhyLabelProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
      <Text style={styles.text}>{reasons[0]}</Text>
    </View>
  );
}

export const WhyLabel = memo(WhyLabelInner as React.FunctionComponent<WhyLabelProps>) as (props: WhyLabelProps) => React.ReactElement | null;

const styles = createStyles({
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
