import React from 'react';
import {
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ViewProps } from 'react-native';
import { COLORS, SPACING, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS, toDimensionValue } from '../constants/theme';
import { ListFooterLoader } from './ListFooterLoader';
import { HeaderIconButton, headerIconCircleSize, headerIconCircleMarginH } from './HeaderIconButton';

const AnimatedView = Animated.View as (props: ViewProps & { style?: any }) => React.ReactElement | null;

const STICKY_HEADER_APPEAR = 120;
const STICKY_FADE_RANGE = 80;

export interface TopicOrCollectionLayoutProps {
  /** Screen title (back bar + sticky bar) */
  title: string;
  loading: boolean;
  notFound: boolean;
  notFoundMessage: string;
  /** Back button press */
  onBack: () => void;
  /** Hero header (TopicCollectionHeader + tabs / more section) */
  headerComponent: React.ReactNode;
  /** Scroll-driven opacity for hero */
  heroOpacity: Animated.AnimatedInterpolation<number>;
  /** Scroll-driven opacity for sticky bar */
  stickyOpacity: Animated.AnimatedInterpolation<number>;
  onScroll: (e: any) => void;
  scrollY: Animated.Value;
  data: any[];
  keyExtractor: (item: any) => string;
  renderItem: ({ item }: { item: any }) => React.ReactElement | null;
  ListEmptyComponent: React.ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
  onEndReached: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  /** Extra padding at bottom (e.g. safe area) */
  bottomPadding?: number;
  /** Optional: action sheet, modals */
  children?: React.ReactNode;
}

/**
 * Shared layout for Topic and Collection detail screens: same header bar, sticky bar, and list structure.
 * Only the data and header content (topic vs collection) differ.
 */
export function TopicOrCollectionLayout({
  title,
  loading,
  notFound,
  notFoundMessage,
  onBack,
  headerComponent,
  heroOpacity,
  stickyOpacity,
  onScroll,
  scrollY,
  data,
  keyExtractor,
  renderItem,
  ListEmptyComponent,
  onRefresh,
  refreshing,
  onEndReached,
  hasMore,
  loadingMore,
  bottomPadding = 0,
  children,
}: TopicOrCollectionLayoutProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [stickyVisible, setStickyVisible] = React.useState(false);

  const paddingBottom = bottomPadding > 0 ? bottomPadding : insets.bottom + 24;

  const headerBar = (
    <View style={[styles.headerBar, { paddingTop: insets.top }]}>
      <HeaderIconButton onPress={onBack} icon="arrow-back" accessibilityLabel={t('common.back', 'Back')} />
      <Text style={styles.headerBarTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerBarSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {headerBar}
        <View style={[styles.centered, { paddingBottom: paddingBottom }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {headerBar}
        <View style={[styles.centered, { paddingBottom: paddingBottom }]}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.tertiary} style={styles.errorIcon} />
          <Text style={styles.errorText}>{notFoundMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AnimatedView
        style={[styles.stickyBar, { opacity: stickyOpacity, paddingTop: insets.top }]}
        pointerEvents={stickyVisible ? 'auto' : 'none'}
      >
        <View style={styles.stickyBarContent}>
          <HeaderIconButton onPress={onBack} icon="arrow-back" accessibilityLabel={t('common.back', 'Back')} />
          <Text style={styles.stickyBarTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.stickyBarSpacer} />
        </View>
      </AnimatedView>

      <Animated.FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <AnimatedView style={{ opacity: heroOpacity }}>
            {headerComponent}
          </AnimatedView>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: (e: any) => setStickyVisible(e.nativeEvent.contentOffset.y > STICKY_HEADER_APPEAR) }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<ListFooterLoader visible={!!(hasMore && loadingMore)} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          { paddingBottom: paddingBottom },
          data.length === 0 && { flexGrow: 1 },
        ]}
        {...FLATLIST_DEFAULTS}
      />

      {children}
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  headerBarTitle: {
    flex: 1,
    fontSize: HEADER.titleSize,
    fontWeight: '600',
    color: COLORS.paper,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  headerBarSpacer: {
    width: headerIconCircleSize + headerIconCircleMarginH * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
  errorIcon: {
    marginBottom: SPACING.m,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  list: {
    flex: 1,
  },
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  stickyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    paddingTop: 0,
  },
  stickyBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  stickyBarSpacer: {
    width: headerIconCircleSize + headerIconCircleMarginH * 2,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
