import React, { memo } from "react";
import { View } from "react-native";
import { createStyles } from "../constants/theme";
import { InlineSkeleton } from "./LoadingSkeleton";

export interface InlineLoaderProps {
  /** Optional size: 'small' | 'large'. Default small. */
  size?: "small" | "large";
  /** Optional color override. Unused; kept for API compatibility. */
  color?: string;
  /** Optional style for the wrapper View. */
  style?: object;
}

function InlineLoaderInner({ style }: InlineLoaderProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <InlineSkeleton />
    </View>
  );
}

export const InlineLoader = memo(
  InlineLoaderInner as React.FunctionComponent<InlineLoaderProps>,
) as (props: InlineLoaderProps) => React.ReactElement | null;

const styles = createStyles({
  wrapper: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
