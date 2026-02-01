import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { COLORS, SPACING, SIZES, createStyles } from '../constants/theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

function SkeletonInner({ width = '100%', height = 20, style, borderRadius = 4 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const AnimatedView = Animated.View as any;
  return (
    <AnimatedView
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export const Skeleton = memo(SkeletonInner as React.FunctionComponent<SkeletonProps>) as (props: SkeletonProps) => React.ReactElement | null;

export function PostSkeleton() {
  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <View style={styles.body}>
        <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={16} />
      </View>
      <View style={styles.footer}>
        <Skeleton width={20} height={20} />
        <Skeleton width={20} height={20} />
        <Skeleton width={20} height={20} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Skeleton width={96} height={96} borderRadius={48} style={{ marginBottom: 16 }} />
        <Skeleton width={180} height={24} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={16} style={{ marginBottom: 16 }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: 24 }} />
        <View style={styles.statsRow}>
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
        </View>
      </View>
    </View>
  );
}

const styles = createStyles({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  postContainer: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  headerText: {
    marginLeft: SPACING.m,
  },
  body: {
    marginBottom: SPACING.l,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  profileContainer: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xxl,
    marginTop: SPACING.l,
  },
});
