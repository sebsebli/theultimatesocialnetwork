import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import { WhyLabel } from './WhyLabel';

export const DeepDiveCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.deepDiveCard}>
    <View style={styles.deepDiveHeader}>
      <Text style={styles.deepDiveTitle}>{item.title}</Text>
      {item.reasons && <WhyLabel reasons={item.reasons} />}
    </View>
    <Text style={styles.deepDiveDescription} numberOfLines={2}>
      {/* Fallback to simple concatenation if t() fails or for simple cases, but ideally use translation */}
      Explore verified discussions and citations about {item.title?.toLowerCase()}.
    </Text>
    <View style={styles.viewTopicRow}>
      <Text style={styles.viewTopicText}>VIEW TOPIC</Text>
      <MaterialIcons name="arrow-forward" size={12} color={COLORS.primary} />
    </View>
  </Pressable>
);

export const PersonCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.personCard}>
    <View style={styles.personRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.displayName?.charAt(0) || item.handle?.charAt(0)}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.displayName || item.handle}</Text>
        <Text style={styles.personHandle}>@{item.handle}</Text>
        {item.bio && <Text style={styles.personBio} numberOfLines={1}>{item.bio}</Text>}
      </View>
      {item.reasons && <WhyLabel reasons={item.reasons} />}
    </View>
  </Pressable>
);

export const QuoteCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <View style={styles.quoteWrapper}>
    {/* Re-use PostItem here usually, but if custom: */}
    <Pressable onPress={onPress} style={styles.quoteCard}>
      <Text style={styles.quoteBody} numberOfLines={3}>{item.body}</Text>
    </Pressable>
    {item.reasons && (
      <View style={styles.quoteWhy}>
        <WhyLabel reasons={item.reasons} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  deepDiveCard: {
    backgroundColor: COLORS.hover, // bg-white/[0.02] -> hover
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl, // p-6
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider, // border-white/5 -> divider
    gap: SPACING.m,
  },
  deepDiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deepDiveTitle: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: COLORS.paper, // text-paper
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
    flex: 1,
    marginRight: SPACING.s,
  },
  deepDiveDescription: {
    fontSize: 14, // text-sm
    color: COLORS.secondary, // text-secondary
    fontFamily: FONTS.regular,
  },
  viewTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  viewTopicText: {
    fontSize: 10, // text-xs
    fontWeight: '700', // font-bold
    color: COLORS.primary, // text-primary
    textTransform: 'uppercase',
    letterSpacing: 1.5, // tracking-widest
    fontFamily: FONTS.semiBold,
  },
  personCard: {
    padding: 20, // p-5
    backgroundColor: COLORS.hover, // bg-white/5
    borderRadius: SIZES.borderRadius,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider, // border-white/10
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4
  },
  avatar: {
    width: 56, // w-14
    height: 56, // h-14
    borderRadius: 28, // rounded-full
    backgroundColor: COLORS.divider, // bg-primary/20 fallback
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: COLORS.paper, // text-paper
    fontFamily: FONTS.semiBold,
  },
  personHandle: {
    fontSize: 14, // text-sm
    color: COLORS.tertiary, // text-tertiary
    fontFamily: FONTS.regular,
  },
  personBio: {
    fontSize: 14, // text-sm
    color: COLORS.secondary, // text-secondary
    marginTop: 4, // mt-1
    fontFamily: FONTS.regular,
  },
  quoteWrapper: {
    position: 'relative',
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  quoteCard: {
    // Basic fallback styling
  },
  quoteBody: {
    color: COLORS.paper,
  },
  quoteWhy: {
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
  }
});