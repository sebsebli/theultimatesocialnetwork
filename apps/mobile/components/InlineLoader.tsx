import React, { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS, createStyles, toColor } from '../constants/theme';

export interface InlineLoaderProps {
  /** Optional size: 'small' | 'large'. Default small. */
  size?: 'small' | 'large';
  /** Optional color override. Default COLORS.primary. */
  color?: string;
  /** Optional style for the wrapper View. */
  style?: object;
}

function InlineLoaderInner({ size = 'small', color, style }: InlineLoaderProps) {
  const resolvedColor = color ?? toColor(COLORS.primary);
  return (
    <View style={[styles.wrapper, style]}>
      <ActivityIndicator size={size} color={resolvedColor} />
    </View>
  );
}

export const InlineLoader = memo(InlineLoaderInner as React.FunctionComponent<InlineLoaderProps>) as (
  props: InlineLoaderProps
) => React.ReactElement | null;

const styles = createStyles({
  wrapper: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
