import React, { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS, createStyles } from '../constants/theme';

interface ListFooterLoaderProps {
  visible: boolean;
}

function ListFooterLoaderInner({ visible }: ListFooterLoaderProps) {
  if (!visible) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </View>
  );
}

export const ListFooterLoader = memo(ListFooterLoaderInner as React.FunctionComponent<ListFooterLoaderProps>) as (props: ListFooterLoaderProps) => React.ReactElement | null;

const styles = createStyles({
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
