import React from 'react';
import { StyleSheet, Text, View, Pressable, ImageBackground } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export const DeepDiveCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <Pressable 
    onPress={onPress} 
    style={styles.deepDiveContainer}
    accessibilityLabel={item.title}
    accessibilityRole="button"
  >
    <ImageBackground
      source={{ uri: item.image || 'https://via.placeholder.com/400' }}
      style={styles.deepDiveBackground}
      imageStyle={{ borderRadius: SIZES.borderRadius }}
    >
      <View style={styles.deepDiveOverlay}>
        <View style={styles.whyLabelFloating}>
          <MaterialIcons name="psychology" size={16} color={COLORS.paper} />
          <Text style={styles.whyLabelText}>Why: Cited by 3 authors you follow</Text>
        </View>
        
        <View style={styles.deepDiveContent}>
          <Text style={styles.deepDiveTitle}>{item.title}</Text>
          <Text style={styles.deepDiveDesc} numberOfLines={2}>{item.body}</Text>
          
          <View style={styles.deepDiveFooter}>
            <View style={styles.avatarStack}>
              {/* Mock avatars */}
              <View style={[styles.avatarSmall, { backgroundColor: COLORS.primary, marginLeft: 0 }]} />
              <View style={[styles.avatarSmall, { backgroundColor: COLORS.primaryDark, marginLeft: -8 }]} />
              <View style={[styles.avatarSmall, { backgroundColor: COLORS.tertiary, marginLeft: -8 }]} />
            </View>
            <View style={styles.readButton}>
              <Text style={styles.readButtonText}>Read Deep Dive</Text>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  </Pressable>
);

export const PersonCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <Pressable 
    onPress={onPress} 
    style={styles.cardContainer}
    accessibilityLabel={`${item.displayName}, ${item.handle}`}
    accessibilityRole="button"
  >
    <View style={styles.personHeader}>
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.displayName?.charAt(0) || 'U'}</Text>
        </View>
        <View>
          <Text style={styles.personName}>{item.displayName}</Text>
          <Text style={styles.personRole}>{item.handle} • Researcher</Text>
        </View>
      </View>
      <MaterialIcons name="bookmark-border" size={24} color={COLORS.primary} />
    </View>
    
    <View style={styles.whyBlock}>
      <View style={styles.whyRow}>
        <MaterialIcons name="hub" size={16} color={COLORS.primary} />
        <Text style={styles.whyTitle}>Why: Topic Overlap</Text>
      </View>
      <Text style={styles.whyText}>
        Leading researcher on algorithmic transparency. Aligns with your interest in <Text style={styles.bold}>Explainable AI</Text>.
      </Text>
    </View>

    <View style={styles.tagsRow}>
      <View style={styles.tag}><Text style={styles.tagText}>#AI</Text></View>
      <View style={styles.tag}><Text style={styles.tagText}>#Ethics</Text></View>
      <View style={styles.tag}><Text style={styles.tagText}>#Policy</Text></View>
    </View>
  </Pressable>
);

export const QuoteCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <Pressable 
    onPress={onPress} 
    style={styles.cardContainer}
    accessibilityLabel={`Quote: ${item.body.substring(0, 50)}...`}
    accessibilityRole="button"
  >
    <Text style={styles.quoteMark}>”</Text>
    <View style={styles.whyRow}>
      <View style={styles.trendingIcon}>
        <MaterialIcons name="trending-up" size={14} color={COLORS.primary} />
      </View>
      <Text style={styles.whyTitle}>Why: Viral Citation Today</Text>
    </View>
    
    <Text style={styles.quoteText}>
      "{item.body}"
    </Text>
    
    <View style={styles.quoteFooter}>
      <View>
        <Text style={styles.sourceTitle}>Digital Sociology 2024</Text>
        <Text style={styles.citationCount}>Cited in 14 papers this week</Text>
      </View>
      <View style={styles.contextButton}>
        <Text style={styles.contextButtonText}>View Context</Text>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    marginHorizontal: SPACING.l,
  },
  // Deep Dive
  deepDiveContainer: {
    height: 320,
    marginBottom: SPACING.l,
    marginHorizontal: SPACING.l,
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
  },
  deepDiveBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  deepDiveOverlay: {
    padding: SPACING.l,
    backgroundColor: 'rgba(11, 11, 12, 0.85)',
    paddingTop: 60,
  },
  whyLabelFloating: {
    position: 'absolute',
    top: -120,
    left: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  whyLabelText: {
    color: COLORS.paper,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: FONTS.semiBold,
  },
  deepDiveContent: {
    gap: 8,
  },
  deepDiveTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 28,
  },
  deepDiveDesc: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  deepDiveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  readButton: {
    backgroundColor: COLORS.hover,
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  readButtonText: {
    color: COLORS.paper,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.semiBold,
  },
  // Person
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
  },
  personRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  avatar: {
    width: 48, // h-12 w-12
    height: 48,
    borderRadius: 24, // rounded-full
    backgroundColor: 'rgba(110, 122, 138, 0.2)', // bg-primary/20
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary, // text-primary
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  personRole: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  whyBlock: {
    backgroundColor: COLORS.ink, // bg-ink inside card
    padding: SPACING.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  whyTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontFamily: FONTS.semiBold,
  },
  whyText: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  bold: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.hover,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  // Quote
  quoteMark: {
    position: 'absolute',
    top: 0,
    right: 16,
    fontSize: 100,
    color: COLORS.divider,
    opacity: 0.5,
    fontFamily: FONTS.semiBold, // Serif if available
  },
  trendingIcon: {
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    padding: 2,
    borderRadius: 4,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.paper,
    lineHeight: 26,
    marginBottom: SPACING.l,
    marginTop: SPACING.m,
    fontFamily: FONTS.serifRegular, // IBM Plex Serif for content
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.m,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  citationCount: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  contextButton: {
    backgroundColor: COLORS.hover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contextButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
});
