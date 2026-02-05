import React, { memo } from "react";
import { View } from "react-native";
import { ListFooterSkeleton } from "./LoadingSkeleton";

interface ListFooterLoaderProps {
  visible: boolean;
}

function ListFooterLoaderInner({ visible }: ListFooterLoaderProps) {
  if (!visible) return null;
  return (
    <View>
      <ListFooterSkeleton />
    </View>
  );
}

export const ListFooterLoader = memo(
  ListFooterLoaderInner as React.FunctionComponent<ListFooterLoaderProps>,
) as (props: ListFooterLoaderProps) => React.ReactElement | null;
