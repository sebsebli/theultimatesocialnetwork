import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING, FONTS, createStyles } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
}

function SectionHeaderInner({ title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export const SectionHeader = memo(SectionHeaderInner as React.FunctionComponent<SectionHeaderProps>) as (props: SectionHeaderProps) => React.ReactElement | null;

const styles = createStyles({
  container: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
